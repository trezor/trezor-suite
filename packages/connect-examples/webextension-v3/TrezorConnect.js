import { someFn } from './tets2.js';

const TrezorConnect = {
    getAddress: () => {
        return Promise.resolve({
            success: true,
            payload: {
                address: someFn(),
            },
        });
    },
    manifest: () => {
        return Promise.resolve({
            success: true,
            payload: {
                meow: 'wuf',
            },
        });
    },
};

export default TrezorConnect;
