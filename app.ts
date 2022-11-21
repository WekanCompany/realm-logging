import Realm from 'realm';

const realmAppId: string = 'test-validation-fmyzf';

const log = console.log;

// Realm Schema
const DogSchema = {
    name: 'Dog',
    properties: {
        _id: 'objectId',
        name: 'string',
    },
    primaryKey: '_id',
};

/**
 * From the list of different available log levels, one of the log level can be returned
 * @return {LogLevel} Can be any of loglevel specified in realm.
 */

function getLogLevel(): Realm.App.Sync.LogLevel {
    // 'all' | 'trace' | 'debug' | 'detail' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
    return 'all';
}

/**
 */
async function run() {
    const app: Realm.App = new Realm.App({ id: realmAppId });

    // Setting the loglevel to fetch from the realm
    Realm.App.Sync.setLogLevel(app, getLogLevel());

    // Fetch the logs that is set already in the setLogLevel
    Realm.App.Sync.setLogger(app, (level: Realm.App.Sync.NumericLogLevel, message: string) => {
        log(`Log Level:${level}, Message: ${message}`);
    });

    // Signing in anonymously. Make sure the anonymous sign in option is enabled in the App Services
    const credentials: Realm.Credentials = Realm.Credentials.anonymous();

    // Logging in with the realm credentials to get the realm user
    const user: Realm.User = await app.logIn(credentials);
    try {
        // Opening the flexible synced realm with initial subscriptions
        const realm: Realm = await Realm.open({
            schema: [
                DogSchema
            ],
            sync: {
                flexible: true,
                user: user,
                initialSubscriptions: {
                    update: (subs: Realm.App.Sync.MutableSubscriptionSet, realm: Realm) => {
                        subs.add(realm.objects('DogSchema'));
                    },
                },
                clientReset: {
                    mode: Realm.ClientResetMode.DiscardUnsyncedChanges,
                    onBefore: (localRealm: Realm) => {
                        log(localRealm.path);
                    },
                    onAfter: (localRealm: Realm, remoteRealm: Realm) => {
                        log(localRealm.path);
                        log(remoteRealm.path);
                    },
                },
                onError: (session: Realm.App.Sync.Session, error: any) => {
                    log(error.name);
                    log(error.message);
                    log(session.isConnected());
                    log(session.connectionState);
                },
            },
        });
        realm.close();
        return;
    } catch (error) {
        log(error);
    }
}

run();
