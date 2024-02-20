// Karma custom plugin

const { CACHE } = require('./__txcache__');
const { createServer, transformCoinsJson } = require('./__wscache__');

function CustomReporter(rootConfig, logger) {
    const log = logger.create('reporter.TrezorConnect');

    return {
        onRunStart: () => {
            log.info('Running @trezor/connect tests...');
            log.info('FW:', process.env.TESTS_FIRMWARE);
            log.info('Methods:', process.env.TESTS_INCLUDED_METHODS || 'All');
        },

        onSpecStart: (_browser, spec) => {
            log.warn('onSpecStart', spec);
        },

        onSpecComplete: (_browser, spec) => {
            log.info(spec.success ? '✓' : '✖', spec.fullName);
            if (!spec.success) {
                log.info(spec);
            }
        },

        onRunComplete: () => {
            log.warn('onRunComplete');
        },

        onExit: done => {
            log.warn('onExit');
            done();
        },
    };
}
CustomReporter.$inject = ['config', 'logger'];

// node.js "fs" package is not available in karma (browser) env.
// stringify CACHE object and inject it into a browser global.TestUtils context, same as jest.setup
function TxCachePreprocessor(logger) {
    return function (content, file, done) {
        const log = logger.create('preprocessor.TxCachePreprocessor');
        log.info('Processing cache...');
        done(
            `const CACHE = ${JSON.stringify(CACHE)};
            const TESTS_USE_TX_CACHE = ${process.env.TESTS_USE_TX_CACHE};
            TestUtils.TX_CACHE = (txs, force = false) => { if (TESTS_USE_TX_CACHE === false && !force) return []; return txs.map(hash => CACHE[hash]); };`,
        );
    };
}

TxCachePreprocessor.$inject = ['logger'];

function WsCachePreprocessor(logger) {
    return function (content, file, done) {
        if (process.env.TESTS_USE_WS_CACHE !== 'true') {
            done(content);

            return;
        }
        const log = logger.create('preprocessor.WsCachePreprocessor');
        const json = transformCoinsJson(JSON.parse(content));
        log.info('Processing coins.json...');
        done(JSON.stringify(json));
    };
}
WsCachePreprocessor.$inject = ['logger'];

function WebSocketServerFactory(args, config, logger) {
    if (process.env.TESTS_USE_WS_CACHE !== 'true') return;
    const log = logger.create('framework.WebSocketServer');

    log.info('Starting websocket server...');
    createServer().then(() => {
        log.info('Server started...');
    });
}

module.exports = {
    'preprocessor:TxCachePreprocessor': ['factory', TxCachePreprocessor],
    'preprocessor:WsCachePreprocessor': ['factory', WsCachePreprocessor],
    'reporter:CustomReporter': ['type', CustomReporter],
    'framework:WebsocketServer': ['factory', WebSocketServerFactory],
};
