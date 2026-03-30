import { Backend } from 'kuzzle';
import { PrometheusPlugin } from 'kuzzle-plugin-prometheus';

import config from './config';

import PROFILES from './profiles';
import ROLES from './roles';

import MAPPINGS from './mappings';
import TmcController from './controllers/tmc';

const password = process.env.TMC_ADMIN_PASSWORD || 'ChangeThis';

if (password === 'ChangeThis!') {
    console.error('Please set the TMC_ADMIN_PASSWORD environment variable to a secure password before starting the application.');
    process.exit(1);
}

const app = new Backend('tmc');
const prometheusPlugin = new PrometheusPlugin();

app.plugin.use(prometheusPlugin);

app.config.content.server.maxRequestSize = config.maxRequestSize;
app.config.content.limits.concurrentRequests = config.concurrentRequests;
app.config.content.limits.documentsWriteCount = config.documentsWriteCount;
app.config.content.limits.loginsPerSecond = config.loginsPerSecond;
app.config.set('plugins.kuzzle-plugin-logger.services.stdout.level', 'debug');

app.log.info(`Application server.maxRequestSize updated to: ${config.maxRequestSize}`);
app.log.info(`Application limits.concurrentRequests updated to: ${config.concurrentRequests}`);
app.log.info(`Application limits.documentsWriteCount updated to: ${config.documentsWriteCount}`);
app.log.info(`Application limits.loginsPerSecond updated to: ${config.loginsPerSecond}`);

app.import.roles(ROLES);

let profiles = {};
let users = {};
let mappings = {};

config.gameIndexes.forEach(gi => {
    for (let k in PROFILES) {
        let pName = k.replace(/server-/g, `${gi}-`);
        let profile = JSON.parse(PROFILES[k].replace(/"index":"server"/g, `"index":"${gi}"`));
        profiles[pName] = profile;
    }

    users[`${gi}-user`] = { "content": { "profileIds": [`${gi}-user`], "name": `Server User (${gi})` } };

    mappings[gi] = JSON.parse(JSON.stringify(MAPPINGS));
});

app.import.profiles(profiles);
app.import.users(users);
app.import.mappings(mappings);

app.start()
    .then(async () => {
        app.log.info('Application Started');
        app.log.debug('Debug started');

        for (let k of Object.keys(app.config.content.security.standard.roles)) {
            await app.sdk.security.updateRole(k, app.config.content.security.standard.roles[k])
                .catch((err) => { console.warn(`Failed to update ${k} role, it may not exist.`, err) });
        }
        for (let k of Object.keys(app.config.content.security.standard.profiles)) {
            await app.sdk.security.updateProfile(k, app.config.content.security.standard.profiles[k])
                .catch((err) => { console.warn(`Failed to update ${k} profile, it may not exist.`, err) });
        }

        let adminUser = await app.sdk.security.getUser('tmc-admin').catch(() => null);
        if (adminUser) {
            app.log.info('TMC Admin user already exists, skipping creation.');
            return;
        }
        await app.sdk.security.createFirstAdmin('tmc-admin', {
            content: {
                name: 'TMC Admin'
            },
            credentials: {
                local: {
                    username: 'tmc-admin',
                    password: password
                }
            },
            reset: true
        });

        console.log('Default admin user created with username "tmc-admin" and the provided password.');
    })
    .catch(console.error);

app.pipe.register('request:onError', async (request) => {
    app.log.error(request);
    return request;
});

app.controller.use(new TmcController(app));
