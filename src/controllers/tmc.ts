import { Backend, Controller, ControllerDefinition, KuzzleError, KuzzleRequest } from "kuzzle";

class TmcController extends Controller {
    constructor(app: Backend) {
        super(app);

        this.definition = {
            actions: {
                createPlayer: {
                    handler: this.createPlayer,
                    http: [
                        {
                            verb: 'post',
                            path: '/tmc/createPlayer',
                            openapi: {
                                description: 'Create a new player with a unique playerId. The player will be assigned a profile based on the creator\'s profile and receive an API key valid for 24 hours.',
                                parameters: [
                                    {
                                        in: 'body',
                                        name: 'playerId',
                                        schema: { type: 'string' },
                                        required: true,
                                        description: 'Unique identifier for the player to be created.'
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        }
    }

    async createPlayer(request: KuzzleRequest) {
        const playerId = request.getBodyString('playerId');

        if (!playerId) {
            throw new KuzzleError('playerId is required to create a player.', 400);
        }

        const currentUser = await request.getUser();
        const validProfiles = currentUser.profileIds.filter(v => v.endsWith('-user'));
        if (validProfiles.length === 0) {
            throw new KuzzleError('Current user does not have permission to create players.', 403);
        } else if (validProfiles.length > 1) {
            throw new KuzzleError('Current user has multiple user profiles, cannot determine which one to use for player creation.', 400);
        }
        const index = validProfiles[0].replace(/-user$/, '');
        await app.sdk.index.exists(index).then(exists => {
            if (!exists) {
                throw new KuzzleError(`Index ${index} does not exist, cannot create player.`, 400);
            }
        });
        const playerProfile = `${index}-player`;
        await app.sdk.security.getProfile(playerProfile).catch(() => {
            throw new KuzzleError(`Player profile ${playerProfile} does not exist, cannot create player.`, 400);
        });

        const playerKuid = `${index}-${playerId}`;
        
        const playerExists = await app.sdk.security.getUser(playerKuid).then(() => true).catch(() => false);
        if (playerExists) {
            throw new KuzzleError(`Player with id ${playerKuid} already exists.`, 409);
        }

        await app.sdk.security.createUser(playerKuid, {
            content: {
                profileIds: [playerProfile],
                name: `Player ${playerKuid}`
            }
        });

        const apiKeyResult = await app.sdk.security.createApiKey(playerKuid, 'Player API Key', {
            expiresIn: '24h'
        });

        const apiKey = apiKeyResult?._source?.token;
        if (!apiKey || typeof (apiKey) !== 'string') {
            throw new KuzzleError('Failed to retrieve API key token after creation.', 500);
        }

        return { success: true, playerKuid, index, apiKey: apiKey };
    }
}

export default TmcController;