import {
    type CoinInfo,
    type Device as DeviceMessage,
    type DiscoverAccountsProgress,
    UI_EVENTS,
    createUiEventMessage,
} from '@trezor/connect-common';

import DiscoverAccounts from './discoverAccounts';
import { calculateXPubHash } from './firmware/calculateXPubHash';
import { initBlockchain } from '../backend/BlockchainLink';
import type { MethodContext } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';
import type { Device } from '../device/Device';

jest.mock('../backend/BlockchainLink', () => ({
    initBlockchain: jest.fn(),
    assertBackendSupported: jest.fn(),
}));

jest.mock('../data/coinInfo', () => ({
    getCoinInfoOrThrow: jest.fn(),
}));

const HD_HARDENED = 0x80000000;

// The descriptor is the account index, taken from the last (account) level of the path.
const mockDevice = () =>
    ({
        getVersion: () => undefined,
        getCommands: () => ({
            getAccountDescriptor: (_coinInfo: CoinInfo, addressN: number[]) =>
                Promise.resolve({
                    descriptor: String((addressN.at(-1) ?? 0) % HD_HARDENED),
                }),
        }),
    }) as unknown as Device;

const mockCoinInfo = () => ({ type: 'bitcoin', shortcut: 'BTC' }) as CoinInfo;

type DiscoverParams = {
    usedIndexes: number[];
    accountInfoFailingIndexes?: number[];
    utxoFailingIndexes?: number[];
    skip?: number;
};

const rejectOrResolve = <T>(isFailing: boolean, value: T) =>
    isFailing ? Promise.reject(new Error('Backend error')) : Promise.resolve(value);

const createMethod = (skip = 0) => {
    const method = new DiscoverAccounts({
        payload: {
            method: 'discoverAccounts',
            coins: [{ symbol: 'btc', known: [{ type: 'normal', skip }], knownOnly: true }],
        },
    });
    method.setDevice(mockDevice());

    return method;
};

const discover = async ({
    usedIndexes,
    accountInfoFailingIndexes = [],
    utxoFailingIndexes = [],
    skip = 0,
}: DiscoverParams) => {
    jest.mocked(getCoinInfoOrThrow).mockReturnValue(mockCoinInfo());
    jest.mocked(initBlockchain).mockResolvedValue({
        getAccountInfo: ({ descriptor }: { descriptor: string }) =>
            rejectOrResolve(accountInfoFailingIndexes.includes(Number(descriptor)), {
                empty: !usedIndexes.includes(Number(descriptor)),
            }),
        getAccountUtxo: (descriptor: string) =>
            rejectOrResolve(utxoFailingIndexes.includes(Number(descriptor)), []),
    } as unknown as Awaited<ReturnType<typeof initBlockchain>>);

    const sendCoreMessage = jest.fn();
    const result = await createMethod(skip).run({
        sendCoreMessage,
    } as unknown as MethodContext);
    const discoveredAccounts = sendCoreMessage.mock.calls.map(([message]) => {
        const { response }: { response: DiscoverAccountsProgress } = message.payload;

        return response.failed
            ? { index: response.index, failed: true }
            : { index: response.index, empty: response.empty };
    });

    return { result, discoveredAccounts };
};

describe('DiscoverAccounts', () => {
    it('stops at the first empty account when the next one is empty too', async () => {
        const { result, discoveredAccounts } = await discover({ usedIndexes: [0, 3] });

        expect(discoveredAccounts).toEqual([
            { index: 0, empty: false },
            { index: 1, empty: true },
        ]);
        expect(result).toEqual({ empty: 1, nonempty: 1, failed: 0 });
    });

    it('continues past a single empty account followed by a used one', async () => {
        const { result, discoveredAccounts } = await discover({ usedIndexes: [0, 2, 4] });

        expect(discoveredAccounts).toEqual([
            { index: 0, empty: false },
            { index: 1, empty: true },
            { index: 2, empty: false },
            { index: 3, empty: true },
            { index: 4, empty: false },
            { index: 5, empty: true },
        ]);
        expect(result).toEqual({ empty: 3, nonempty: 3, failed: 0 });
    });

    it('continues past an empty first account followed by a used one', async () => {
        const { discoveredAccounts } = await discover({ usedIndexes: [1] });

        expect(discoveredAccounts).toEqual([
            { index: 0, empty: true },
            { index: 1, empty: false },
            { index: 2, empty: true },
        ]);
    });

    it('counts only the accounts from the skipped index on', async () => {
        const { result, discoveredAccounts } = await discover({ usedIndexes: [2, 4], skip: 2 });

        expect(discoveredAccounts).toEqual([
            { index: 2, empty: false },
            { index: 3, empty: true },
            { index: 4, empty: false },
            { index: 5, empty: true },
        ]);
        expect(result).toEqual({ empty: 2, nonempty: 2, failed: 0 });
    });

    it('counts a failed account as neither empty nor nonempty', async () => {
        const { result, discoveredAccounts } = await discover({
            usedIndexes: [0, 2],
            utxoFailingIndexes: [2],
        });

        expect(discoveredAccounts).toEqual([
            { index: 0, empty: false },
            { index: 1, empty: true },
            { index: 2, failed: true },
        ]);
        expect(result).toEqual({ empty: 1, nonempty: 1, failed: 1 });
    });

    it('ends at the empty account when looking past it fails', async () => {
        const { result, discoveredAccounts } = await discover({
            usedIndexes: [0, 2],
            accountInfoFailingIndexes: [2],
        });

        expect(discoveredAccounts).toEqual([
            { index: 0, empty: false },
            { index: 1, empty: true },
        ]);
        expect(result).toEqual({ empty: 1, nonempty: 1, failed: 0 });
    });

    it('counts nothing when the backend cannot be initialized', async () => {
        jest.mocked(getCoinInfoOrThrow).mockReturnValue(mockCoinInfo());
        jest.mocked(initBlockchain).mockRejectedValue(new Error('Backend error'));

        const result = await createMethod().run({
            sendCoreMessage: jest.fn(),
        } as unknown as MethodContext);

        expect(result).toEqual({ empty: 0, nonempty: 0, failed: 1 });
    });
});

const path = "m/84'/0'/0'";
const xpub = 'xpub-of-the-created-wallet';
const otherXpub = 'xpub-of-another-wallet';
const deviceMessage = { id: 'device-id' } as DeviceMessage;

const createEntropyCheckMethod = ({
    passphraseProtection = false,
    useEmptyPassphrase = false,
}: { passphraseProtection?: boolean; useEmptyPassphrase?: boolean } = {}) => {
    const method = new DiscoverAccounts({
        payload: {
            method: 'discoverAccounts',
            coins: [],
            entropyCheckResult: {
                success: true,
                xpubHashes: { [path]: calculateXPubHash(xpub) },
            },
            device: { useEmptyPassphrase },
        },
    });
    const device = {
        features: { passphrase_protection: passphraseProtection },
        toMessageObject: () => deviceMessage,
    } as Device;
    method.setDevice(device);

    return method;
};

describe('DiscoverAccounts discovery entropy check', () => {
    it('emits success when the xpub matches the known hash', () => {
        const sendCoreMessage = jest.fn();
        createEntropyCheckMethod()['checkEntropy']({ xpub, path, sendCoreMessage });

        expect(sendCoreMessage).toHaveBeenCalledWith(
            createUiEventMessage(UI_EVENTS.DISCOVERY_ENTROPY_CHECK, {
                device: deviceMessage,
                success: true,
                path,
            }),
        );
    });

    it('emits failure without throwing when the xpub does not match the known hash', () => {
        const sendCoreMessage = jest.fn();
        createEntropyCheckMethod()['checkEntropy']({ xpub: otherXpub, path, sendCoreMessage });

        expect(sendCoreMessage).toHaveBeenCalledWith(
            createUiEventMessage(UI_EVENTS.DISCOVERY_ENTROPY_CHECK, {
                device: deviceMessage,
                success: false,
                path,
            }),
        );
    });

    it('emits nothing when there is no known hash for the path', () => {
        const sendCoreMessage = jest.fn();
        createEntropyCheckMethod()['checkEntropy']({ xpub, path: "m/44'/0'/0'", sendCoreMessage });

        expect(sendCoreMessage).not.toHaveBeenCalled();
    });

    it('emits nothing for accounts without xpub', () => {
        const sendCoreMessage = jest.fn();
        createEntropyCheckMethod()['checkEntropy']({ xpub: undefined, path, sendCoreMessage });

        expect(sendCoreMessage).not.toHaveBeenCalled();
    });

    it('emits nothing for passphrase wallets', () => {
        const sendCoreMessage = jest.fn();
        createEntropyCheckMethod({ passphraseProtection: true })['checkEntropy']({
            xpub: otherXpub,
            path,
            sendCoreMessage,
        });

        expect(sendCoreMessage).not.toHaveBeenCalled();
    });

    it('checks the standard wallet even when passphrase protection is enabled', () => {
        const sendCoreMessage = jest.fn();
        createEntropyCheckMethod({ passphraseProtection: true, useEmptyPassphrase: true })[
            'checkEntropy'
        ]({
            xpub,
            path,
            sendCoreMessage,
        });

        expect(sendCoreMessage).toHaveBeenCalledWith(
            createUiEventMessage(UI_EVENTS.DISCOVERY_ENTROPY_CHECK, {
                device: deviceMessage,
                success: true,
                path,
            }),
        );
    });
});
