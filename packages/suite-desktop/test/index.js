const Application = require('spectron').Application;
const assert = require('assert');
const fetch = require('node-fetch');

/**
 * TODO:
 * - use a robust assertions lib, probably jest
 * - file structure for electron e2e tests
 */

const run = async () => {
    let app;
    try {
        app = await new Application({
            path: './Trezor Suite-20.10.1.AppImage',
        }).start();

        const count = await app.client.getWindowCount();
        assert.equal(count, 1);

        console.log('Test: Server is running');

        let response = await fetch('http://127.0.0.1:21335/oauth', { method: 'GET' });
        assert.equal(response.status, 2080);

        console.log('Test: Stopping applications stops the server as well');
        await app.stop();
        try {
            response = await fetch('http://127.0.0.1:21335/oauth', { method: 'GET' });
            assert.equal('does not', 'get here');
        } catch (err) {
            assert.equal(err.code, 'ECONNREFUSED');
        }

        console.log('Tests great success!');

        process.exit();
    } catch (err) {
        console.log('Tests failed');
        console.log(err);
        if (app) {
            await app.stop();
        }
        process.exit(1);
    }
};

run();
