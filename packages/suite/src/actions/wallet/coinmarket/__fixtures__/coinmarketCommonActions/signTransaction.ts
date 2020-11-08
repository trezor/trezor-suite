import { BTC_ACCOUNT, ETH_ACCOUNT, XRP_ACCOUNT } from './accounts';
import { SignTransactionData } from '@wallet-types/transaction';

const { getSuiteDevice } = global.JestMocks;
const AVAILABLE_DEVICE = getSuiteDevice({ available: true, connected: true });

export const BTC_SIGN_TRANSACTION_FIXTURES = [
    {
        description: 'signTransaction, bitcoin account, normal',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
            wallet: {
                selectedAccount: { status: 'loaded', account: BTC_ACCOUNT },
            },
        },
        params: {
            data: <SignTransactionData>{
                account: BTC_ACCOUNT,
                amount: '1',
                address: 'bc1q5y487p64hfsjc5gdfeezv29zwcddz5kahve0kp',
                network: {
                    name: 'Bitcoin',
                    networkType: 'bitcoin',
                    symbol: 'btc',
                    bip44: "m/84'/0'/i'",
                    hasSignVerify: true,
                    decimals: 8,
                    explorer: {
                        tx: 'https://btc1.trezor.io/tx/',
                        account: 'https://btc1.trezor.io/xpub/',
                    },
                },
                transactionInfo: {
                    type: 'final',
                    max: '0.03701607',
                    totalSpent: '3702020',
                    fee: '413',
                    feePerByte: '1',
                    bytes: 413,
                    transaction: {
                        inputs: [
                            {
                                address_n: [2147483697, 2147483650, 2147483648, 1, 3],
                                prev_index: 0,
                                prev_hash:
                                    '5fe2a557a64d3f724f6c68bd762172eb8af4d92b6d9fdb8a0cd8e39b3e560605',
                                script_type: 'SPENDP2SHWITNESS',
                                amount: '638921',
                                sequence: 4294967295,
                            },
                            {
                                address_n: [2147483697, 2147483650, 2147483648, 1, 4],
                                prev_index: 0,
                                prev_hash:
                                    '6e769b5441b75380892ed7cb4b9f67457aba41e9b5a20c78325a06bdf50e4f10',
                                script_type: 'SPENDP2SHWITNESS',
                                amount: '1014197',
                                sequence: 4294967295,
                            },
                            {
                                address_n: [2147483697, 2147483650, 2147483648, 1, 5],
                                prev_index: 0,
                                prev_hash:
                                    '7973b55a435802183b0ef4371173de0eacb0d11e58f59a1d62587d485272af3c',
                                script_type: 'SPENDP2SHWITNESS',
                                amount: '1612302',
                                sequence: 4294967295,
                            },
                            {
                                address_n: [2147483697, 2147483650, 2147483648, 1, 6],
                                prev_index: 0,
                                prev_hash:
                                    '8d47dc28cfd874e25c0c129be7bc47106c35bb9f46e600888abe825e72e5ab02',
                                script_type: 'SPENDP2SHWITNESS',
                                amount: '436600',
                                sequence: 4294967295,
                            },
                        ],
                        outputs: [
                            {
                                address: 'LaJ2xRorFhu5jZwaq4Xycr6nRSNC8L976b',
                                amount: '3701607',
                                script_type: 'PAYTOADDRESS',
                            },
                        ],
                    },
                },
            },
        },
        connect: [
            {
                response: {
                    success: true,
                    payload: [{ type: 'nonfinal', totalSpent: '10000000', feePerByte: '1' }],
                },
            },
        ],
    },
];

export const ETH_SIGN_TRANSACTION_FIXTURES = [
    {
        description: 'signTransaction, ethereum account, normal',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
            wallet: {
                selectedAccount: { status: 'loaded', account: XRP_ACCOUNT },
                transactions: [{}],
            },
        },
        params: {
            data: <SignTransactionData>{
                account: ETH_ACCOUNT,
                address: '0x517868D10dD5b8279BAe06E5fb649eDa1Da49833',
                amount: '85277520000000000',
                network: {
                    name: 'Ethereum',
                    networkType: 'ethereum',
                    symbol: 'eth',
                    chainId: 1,
                    bip44: "m/44'/60'/0'/0/i",
                    hasSignVerify: true,
                    decimals: 18,
                    explorer: {
                        tx: 'https://eth1.trezor.io/tx/',
                        account: 'https://eth1.trezor.io/address/',
                    },
                },
                transactionInfo: {
                    type: 'final',
                    totalSpent: '85277520000000000',
                    fee: '945000000000000',
                    feePerByte: '45',
                    max: '0.03701607',
                    feeLimit: '21000',
                    bytes: 0,
                    transaction: {
                        inputs: [],
                        outputs: [
                            {
                                address: '0x8185b57ac7ee339245dd2c06Bdd056Aec2844d4D',
                                amount: '84332520000000000',
                                script_type: 'PAYTOADDRESS',
                            },
                        ],
                    },
                },
            },
        },
        connect: [
            {
                response: {
                    success: true,
                    payload: [{ type: 'nonfinal', totalSpent: '10000000', feePerByte: '1' }],
                },
            },
        ],
    },
];

export const XRP_SIGN_TRANSACTION_FIXTURES = [
    {
        description: 'signTransaction, ripple account, normal',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
            wallet: {
                selectedAccount: { status: 'loaded', account: XRP_ACCOUNT },
            },
        },
        params: {
            data: <SignTransactionData>{
                account: XRP_ACCOUNT,
                amount: '1',
                address: 'bc1q5y487p64hfsjc5gdfeezv29zwcddz5kahve0kp',
                network: {
                    name: 'XRP',
                    networkType: 'ripple',
                    symbol: 'xrp',
                    bip44: "m/44'/144'/i'/0/0",
                    decimals: 6,
                    explorer: {
                        tx: 'https://xrpscan.com/tx/',
                        account: 'https://xrpscan.com/account/',
                    },
                },
                transactionInfo: {
                    type: 'final',
                    max: '0.03701607',
                    totalSpent: '3702020',
                    fee: '413',
                    feePerByte: '1',
                    bytes: 413,
                    transaction: {
                        inputs: [
                            {
                                address_n: [2147483697, 2147483650, 2147483648, 1, 3],
                                prev_index: 0,
                                prev_hash:
                                    '5fe2a557a64d3f724f6c68bd762172eb8af4d92b6d9fdb8a0cd8e39b3e560605',
                                script_type: 'SPENDP2SHWITNESS',
                                amount: '638921',
                                sequence: 4294967295,
                            },
                            {
                                address_n: [2147483697, 2147483650, 2147483648, 1, 4],
                                prev_index: 0,
                                prev_hash:
                                    '6e769b5441b75380892ed7cb4b9f67457aba41e9b5a20c78325a06bdf50e4f10',
                                script_type: 'SPENDP2SHWITNESS',
                                amount: '1014197',
                                sequence: 4294967295,
                            },
                            {
                                address_n: [2147483697, 2147483650, 2147483648, 1, 5],
                                prev_index: 0,
                                prev_hash:
                                    '7973b55a435802183b0ef4371173de0eacb0d11e58f59a1d62587d485272af3c',
                                script_type: 'SPENDP2SHWITNESS',
                                amount: '1612302',
                                sequence: 4294967295,
                            },
                            {
                                address_n: [2147483697, 2147483650, 2147483648, 1, 6],
                                prev_index: 0,
                                prev_hash:
                                    '8d47dc28cfd874e25c0c129be7bc47106c35bb9f46e600888abe825e72e5ab02',
                                script_type: 'SPENDP2SHWITNESS',
                                amount: '436600',
                                sequence: 4294967295,
                            },
                        ],
                        outputs: [
                            {
                                address: 'LaJ2xRorFhu5jZwaq4Xycr6nRSNC8L976b',
                                amount: '3701607',
                                script_type: 'PAYTOADDRESS',
                            },
                        ],
                    },
                },
            },
        },
        connect: [
            {
                response: {
                    success: true,
                    payload: [{ type: 'nonfinal', totalSpent: '10000000', feePerByte: '1' }],
                },
            },
        ],
    },
];
