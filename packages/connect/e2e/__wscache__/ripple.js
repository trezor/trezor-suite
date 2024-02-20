const fs = require('fs');
const path = require('path');

const rippleFixtures = {
    server_info: () => ({
        status: 'success',
        type: 'response',
        result: {
            info: {
                build_version: '1.4.0',
                complete_ledgers: '32570-8819951',
                hostid: 'localhost',
                validated_ledger: {
                    age: 7,
                    base_fee_xrp: 0.00001,
                    reserve_base_xrp: 20,
                    reserve_inc_xrp: 5,
                    hash: '1',
                    seq: 1,
                },
                load_factor: 1,
            },
        },
    }),
    account_info: (params, message) => {
        const file = path.resolve(__dirname, `./getAccountInfo/${message.account}.json`);
        const rawJson = fs.readFileSync(file);
        const data = JSON.parse(rawJson);

        return data;
    },
    subscribe: () => ({
        status: 'success',
        type: 'response',
        result: {
            fee_base: 10,
            fee_ref: 10,
            hostid: 'NAP',
            ledger_hash: '60EBABF55F6AB58864242CADA0B24FBEA027F2426917F39CA56576B335C0065A',
            ledger_index: 8819951,
            ledger_time: 463782770,
            load_base: 256,
            load_factor: 256,
            pubkey_node: 'n9Lt7DgQmxjHF5mYJsV2U9anALHmPem8PWQHWGpw4XMz79HA5aJY',
            random: 'EECFEE93BBB608914F190EC177B11DE52FC1D75D2C97DACBD26D2DFC6050E874',
            reserve_base: 20000000,
            reserve_inc: 5000000,
            server_status: 'full',
            validated_ledgers: '32570-8819951',
        },
    }),
    ping: () => ({
        status: 'success',
        type: 'response',
        result: {},
    }),
};

module.exports = {
    rippleFixtures,
};
