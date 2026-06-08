import addressJSON from '../../fixtures/staking/ada-address.json';
import utxosJSON from '../../fixtures/staking/ada-utxos.json';

const FIRST_ACCOUNT_DESCRIPTOR =
    '124ae1de317623ddc8fc91f3c0e67d01f519710df091bc13713548cf2e69d903e52877fc869c6128a63cedb64449499cc04ec2cd5e17f79f0909d96b7efb9046';
const isFirstAccount = (descriptor: string) => descriptor === FIRST_ACCOUNT_DESCRIPTOR;

export const ADA_MOCKED_ACCOUNT = {
    descriptor: FIRST_ACCOUNT_DESCRIPTOR,
    empty: false,
    balance: '88858306',
    availableBalance: '88858306',
    tokens: [],
    history: { total: 0, unconfirmed: 0, transactions: [] },
    page: { index: 1, size: 8, total: 0 },
    misc: {
        staking: {
            address: 'stake1uytalm0k75njyj7v8z580ajs09v5v4lz6yp9akh8cgty43qunjqys',
            rewards: '0',
            isActive: false,
            poolId: null,
            drep: null,
        },
    },
    addresses: addressJSON,
};

export const ADA_MOCKED_EMPTY_ACCOUNT = {
    descriptor: 'some-other-descriptor',
    empty: true,
    balance: '0',
    availableBalance: '0',
    tokens: [],
    history: { total: 0, unconfirmed: 0, transactions: [] },
    page: { index: 1, size: 8, total: 0 },
    misc: {
        staking: {
            address: null,
            rewards: '0',
            isActive: false,
            poolId: null,
            drep: null,
        },
    },
    addresses: addressJSON,
};

export const fixtures = [
    {
        method: 'GET_SERVER_INFO',
        default: true,
        response: {
            type: 'message',
            data: {
                hostname: 'backend13',
                name: 'Cardano',
                shortcut: 'ada',
                testnet: false,
                version: '4.2.0',
                decimals: 6,
                blockHeight: 12822637,
                blockHash: 'd37a84e3f2a5a57e914b2ca0317b77a6521d308288ef85619e67fd771a60b3c1',
            },
        },
    },
    {
        method: 'GET_ACCOUNT_INFO',
        default: true,
        response: ({ params }: any) => ({
            data: isFirstAccount(params.descriptor) ? ADA_MOCKED_ACCOUNT : ADA_MOCKED_EMPTY_ACCOUNT,
        }),
    },
    {
        method: 'GET_ACCOUNT_UTXO',
        default: true,
        response: ({ params }: any) => {
            if (isFirstAccount(params.descriptor)) {
                return utxosJSON;
            }
        },
    },
    {
        method: 'ESTIMATE_FEE',
        default: true,
        response: { type: 'message', data: { lovelacePerByte: 44 } },
    },
    {
        method: 'SUBSCRIBE_ADDRESS',
        default: true,
        response: { type: 'message', data: { subscribed: true } },
    },
    {
        method: 'SUBSCRIBE_BLOCK',
        default: true,
        response: { type: 'message', data: { subscribed: true } },
    },
    {
        method: 'GET_BLOCK',
        default: true,
        response: {
            data: {
                time: 1506203091,
                height: null,
                hash: '5f20df933584822601f9e3f8c024eb5eb252fe8cefb24d1317dc3d432e940ebb',
                slot: null,
                epoch: null,
                epoch_slot: null,
                slot_leader: 'Genesis slot leader',
                size: 0,
                tx_count: 14505,
                output: '31112484745000000',
                fees: '0',
                block_vrf: null,
                previous_block: null,
                next_block: '89d9b5a5b8ddc8d7e5a6795e9774d97faf1efea59b2caf7eaf9f8c5b32059df4',
                confirmations: 5833137,
            },
        },
    },
    {
        method: 'PUSH_TRANSACTION',
        default: true,
        response: {
            type: 'message',
            data: 'f67d0ba095ab897c388c07f6911a70fb48ab4927652c7def353184eb3a4fe8a5',
        },
    },
];
