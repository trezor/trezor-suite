import { run } from 'jest';

const setup = () => {
    process.env.BASE_FW_URL = 'https://connect.trezor.io/8';
    try {
        run(undefined, 'jest.config.integration.js');
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

setup();
