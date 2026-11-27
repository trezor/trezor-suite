import TrezorConnect, {
    type CallMethodPayload,
    type SignTransaction,
    asCoinSymbol,
} from '@trezor/connect';
import { serializeError } from '@trezor/connect-common/src/constants/errors';
import GetAccountInfo from '@trezor/connect-core/src/api/getAccountInfo';
import GetCoinInfo from '@trezor/connect-core/src/api/getCoinInfo';
import PushTransaction from '@trezor/connect-core/src/api/pushTransaction';
import { getMethod } from '@trezor/connect-core/src/core/method';

import { getMethodInfo } from './methodInfo';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: { getCoinInfo: jest.fn() },
}));

// The method Connect would run for the call, where it resolves the coins of the call.
const createConnectMethod = (payload: CallMethodPayload) =>
    getMethod({ id: '1', type: 'iframe-call', payload });

const BTC_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

const ETHEREUM_TRANSACTION = {
    to: '0x7314e0f1c0e28474bdb6be3e2c3e0453255188f8',
    value: '0x0',
    gasPrice: '0x1',
    gasLimit: '0x5208',
    nonce: '0x0',
    chainId: 1,
};

const TAPROOT_SIGN_TRANSACTION: SignTransaction = {
    coin: 'test',
    inputs: [
        {
            address_n: "m/86'/1'/0'/0/0",
            prev_hash: 'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00',
            prev_index: 0,
            amount: '129999867',
            script_type: 'SPENDTAPROOT',
        },
    ],
    outputs: [
        {
            address: 'tb1q9l0rk0gkgn73d0gc57qn3t3cwvucaj3h8wtrlu',
            amount: '129999000',
            script_type: 'PAYTOADDRESS',
        },
    ],
};

// Calls whose coins the popup resolves, as Connect does for the call: from the params, from the
// path or as the network of the method.
const COIN_RESOLVING_CALLS: [string, CallMethodPayload][] = [
    ['bitcoin address', { method: 'getAddress', path: "m/84'/0'/0'/0/0" }],
    ['address of a coin', { method: 'getAddress', coin: 'ltc', path: "m/84'/2'/0'/0/0" }],
    [
        'address of a coin of another family',
        { method: 'getAddress', coin: 'eth', path: "m/84'/0'/0'/0/0" },
    ],
    [
        'bundle of addresses',
        {
            method: 'getAddress',
            bundle: [{ path: "m/84'/0'/0'/0/0" }, { coin: 'ltc', path: "m/84'/2'/0'/0/0" }],
        },
    ],
    ['bitcoin public key', { method: 'getPublicKey', path: "m/49'/0'/0'" }],
    ['public key of a coin', { method: 'getPublicKey', coin: 'test', path: "m/84'/1'/0'" }],
    ['bitcoin message', { method: 'signMessage', path: "m/84'/0'/0'/0/0", message: 'hello' }],
    ['message of no coin', { method: 'signMessage', path: "m/44'/60'/0'/0/0", message: 'hi' }],
    ['ownership id', { method: 'getOwnershipId', path: "m/86'/0'/0'/0/0" }],
    ['ownership proof', { method: 'getOwnershipProof', path: "m/86'/0'/0'/0/0" }],
    ['bitcoin transaction', { method: 'signTransaction', ...TAPROOT_SIGN_TRANSACTION }],
    [
        'sent transaction',
        {
            method: 'sendTransaction',
            coin: 'btc',
            outputs: [{ address: BTC_ADDRESS, amount: '1000' }],
            push: true,
        },
    ],
    ['bitcoin account', { method: 'selectAccount', coin: 'btc' }],
    ['ethereum account', { method: 'selectAccount', coin: 'eth' }],
    ['ethereum address', { method: 'ethereumGetAddress', path: "m/44'/60'/0'/0/0" }],
    ['ethereum classic address', { method: 'ethereumGetAddress', path: "m/44'/61'/0'/0/0" }],
    [
        'address of no ethereum network',
        { method: 'ethereumGetAddress', path: "m/44'/9999'/0'/0/0" },
    ],
    ['ethereum public key', { method: 'ethereumGetPublicKey', path: "m/44'/60'/0'" }],
    [
        'ethereum transaction',
        {
            method: 'ethereumSignTransaction',
            path: "m/44'/60'/0'/0/0",
            transaction: ETHEREUM_TRANSACTION,
        },
    ],
    [
        'ethereum message',
        { method: 'ethereumSignMessage', path: "m/44'/60'/0'/0/0", message: 'hello' },
    ],
    [
        'public keys of two coins',
        { method: 'getPublicKey', bundle: [{ path: "m/84'/0'/0'" }, { path: "m/84'/2'/0'" }] },
    ],
    [
        'verified message',
        {
            method: 'verifyMessage',
            coin: 'btc',
            address: BTC_ADDRESS,
            message: 'hello',
            signature: '00',
        },
    ],
    [
        'bundle of ethereum addresses',
        {
            method: 'ethereumGetAddress',
            bundle: [{ path: "m/44'/60'/0'/0/0" }, { path: "m/44'/61'/0'/0/0" }],
        },
    ],
    ['cardano public key', { method: 'cardanoGetPublicKey', path: "m/1852'/1815'/0'" }],
    ['monero watch key', { method: 'moneroGetWatchKey', path: "m/44'/128'/0'" }],
    ['solana public key', { method: 'solanaGetPublicKey', path: "m/44'/501'/0'/0'" }],
    [
        'bundle of solana addresses',
        {
            method: 'solanaGetAddress',
            bundle: [{ path: "m/44'/501'/0'/0'" }, { path: "m/44'/501'/1'/0'" }],
        },
    ],
    ['monero address', { method: 'moneroGetAddress', path: "m/44'/128'/0'" }],
    ['ripple address', { method: 'rippleGetAddress', path: "m/44'/144'/0'/0/0" }],
    ['solana address', { method: 'solanaGetAddress', path: "m/44'/501'/0'/0'" }],
    ['stellar address', { method: 'stellarGetAddress', path: "m/44'/148'/0'" }],
    ['tron address', { method: 'tronGetAddress', path: "m/44'/195'/0'/0/0" }],
    [
        'nostr public key',
        { method: 'nostrGetPublicKey', path: "m/44'/1237'/0'/0/0", __experimental: true },
    ],
];

const getCoinSymbol = (coinInfo?: { shortcut: string }) => coinInfo?.shortcut.toLowerCase();

describe('getMethodInfo', () => {
    beforeEach(() => {
        jest.mocked(TrezorConnect.getCoinInfo).mockImplementation(async params => {
            try {
                const method = new GetCoinInfo({ payload: { ...params, method: 'getCoinInfo' } });

                return { success: true as const, payload: await method.run() };
            } catch (error) {
                return { success: false as const, error: serializeError(error) };
            }
        });
    });

    it.each(COIN_RESOLVING_CALLS)(
        'asks for the coins Connect runs the %s with',
        async (_, call) => {
            const method = await createConnectMethod(call);
            const { requiredPermissions } = await getMethodInfo(call);

            expect(new Set(requiredPermissions.map(({ coin }) => coin))).toEqual(
                new Set(method['requiredFirmwareCoins'].map(getCoinSymbol)),
            );
        },
    );

    it('asks for the coin Connect runs the account info with', async () => {
        const call = { coin: 'ltc', descriptor: 'ltub' } as const;
        const method = new GetAccountInfo({ payload: { method: 'getAccountInfo', ...call } });
        const { requiredPermissions } = await getMethodInfo({ method: 'getAccountInfo', ...call });

        expect(requiredPermissions).toEqual([
            { permission: 'read_account_info', coin: getCoinSymbol(method['params'].coinInfo) },
        ]);
    });

    it('asks for the coin Connect pushes the transaction with', async () => {
        const call = { coin: 'ltc', tx: '00' } as const;
        const method = new PushTransaction({ payload: { method: 'pushTransaction', ...call } });
        const { requiredPermissions } = await getMethodInfo({ method: 'pushTransaction', ...call });

        expect(requiredPermissions).toEqual([
            { permission: 'push_tx', coin: getCoinSymbol(method['params'].coinInfo) },
        ]);
    });

    it('rejects an account of an unknown coin, as Connect does', async () => {
        await expect(
            getMethodInfo({ method: 'selectAccount', coin: asCoinSymbol('nope') }),
        ).rejects.toMatchObject({
            code: 'Method_UnknownCoin',
        });
    });

    it('rejects a method no host can call', async () => {
        await expect(getMethodInfo({ method: 'firmwareUpdate' })).rejects.toMatchObject({
            code: 'Method_Unsupported',
        });
    });
});
