import fetch from 'node-fetch';
import { run } from 'jest';

const setup = async () => {
    const BASE_FW_URL = 'https://wallet.trezor.io';

    try {
        const response1 = await fetch(`${BASE_FW_URL}/data/firmware/1/releases.json`);
        const json1 = await response1.json();
        const response2 = await fetch(`${BASE_FW_URL}/data/firmware/2/releases.json`);
        const json2 = await response2.json();

        process.env.BASE_FW_URL = BASE_FW_URL;
        process.env.RELEASES_T1 = JSON.stringify(json1);
        process.env.RELEASES_T2 = JSON.stringify(json2);

        run(undefined, 'jest.config.integration.js');
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

setup();
