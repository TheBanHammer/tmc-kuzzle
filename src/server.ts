import { Backend } from 'kuzzle';
import { PrometheusPlugin } from 'kuzzle-plugin-prometheus';

import config from './config';

import USERS from './users';
import PROFILES from './profiles';
import ROLES from './roles';

import MAPPINGS from './mappings';

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
    .then(() => {
        app.log.info('Application Started');
        app.log.debug('Debug started');
    })
    .catch(console.error);

app.pipe.register('request:onError', async (request) => {
    app.log.error(request);
    return request;
});
