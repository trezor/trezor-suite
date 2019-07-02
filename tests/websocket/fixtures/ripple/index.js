/* eslint-disable global-require */
// mocked rippled responses
// copied from: https://github.com/ripple/ripple-lib/tree/develop/test/fixtures/rippled

export default {
    server_info: {
        status: 'success',
        type: 'response',
        result: {
            info: {
                build_version: '0.24.0-rc1',
                hostid: 'localhost',
                validated_ledger: {
                    base_fee_xrp: 0.00001,
                    reserve_base_xrp: 20,
                    reserve_inc_xrp: 5,
                    hash: '1',
                    seq: 1,
                },
            },
        },
    },
    subscribe: require('./subscribe'),
    unsubscribe: {
        result: {},
        status: 'success',
        type: 'response',
    },
    serverInfo: {
        normal: require('./serverInfo'),
    },
    account_info: {
        status: 'error',
        type: 'response',
        error: 'actNotFound',
        error_code: 19,
        error_message: 'Account not found.',
        ledger_hash: 'FDFA9E459F54932F2713F6728A6102E8255C3C8441C717CD7689AD0C38F228AD',
        ledger_index: 48356306,
        validated: true,
    },
    account_tx: require('./get-account-tx'),
};
