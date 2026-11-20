import {
    type AccountInfo,
    type CoinInfo,
    type Device as DeviceMessage,
    type DiscoverAccountsProgress,
    type DiscoveryAccountInfoParams,
    UI_EVENTS,
    UI_REQUESTS,
    UI_RESPONSE,
    createUiEventMessage,
} from '@trezor/connect-common';

import DiscoverAccounts from './discoverAccounts';
import { calculateXPubHash } from './firmware/calculateXPubHash';
import type { MethodContext } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';
import type { Device } from '../device/Device';
import { createUiPromiseManager } from '../utils/uiPromiseManager';

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

const mockAccountInfo = (descriptor: string, isEmpty: boolean): AccountInfo => ({
    descriptor,
    balance: isEmpty ? '0' : '1000',
    availableBalance: isEmpty ? '0' : '1000',
    empty: isEmpty,
    history: { total: isEmpty ? 0 : 1, unconfirmed: 0 },
});

type DiscoverParams = {
    usedIndexes: number[];
    accountInfoFailingIndexes?: number[];
    // Indexes whose reads fail only with full details, like a failed UTXO fetch.
    detailsFailingIndexes?: number[];
    skip?: number;
};

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

// Answers the account info requests the way Suite does, with the response of getAccountInfo.
const discover = async ({
    usedIndexes,
    accountInfoFailingIndexes = [],
    detailsFailingIndexes = [],
    skip = 0,
}: DiscoverParams) => {
    jest.mocked(getCoinInfoOrThrow).mockReturnValue(mockCoinInfo());
    const uiPromises = createUiPromiseManager();
    const requests: DiscoveryAccountInfoParams[] = [];
    const discoveredAccounts: (
        { index: number; failed: true } | { index: number; empty: boolean }
    )[] = [];

    const sendCoreMessage: MethodContext['sendCoreMessage'] = message => {
        if (message.type === UI_EVENTS.BUNDLE_PROGRESS) {
            const { response }: { response: DiscoverAccountsProgress } = message.payload;
            discoveredAccounts.push(
                response.failed
                    ? { index: response.index, failed: true }
                    : { index: response.index, empty: response.empty },
            );
        }
        if (message.type !== UI_REQUESTS.REQUEST_DISCOVERY_ACCOUNT_INFO) return;

        const { descriptor, details } = message.payload;
        const index = Number(descriptor);
        const isFailing =
            accountInfoFailingIndexes.includes(index) ||
            (details !== 'basic' && detailsFailingIndexes.includes(index));
        requests.push(message.payload);
        uiPromises.resolve({
            type: UI_RESPONSE.RECEIVE_DISCOVERY_ACCOUNT_INFO,
            payload: isFailing
                ? { success: false, error: { message: 'Backend error', code: 'Backend_Error' } }
                : {
                      success: true,
                      payload: mockAccountInfo(descriptor, !usedIndexes.includes(index)),
                  },
            requestId: message.requestId,
        });
    };
    const result = await createMethod(skip).run({
        sendCoreMessage,
        createUiPromise: uiPromises.create,
    });

    return { result, discoveredAccounts, requests };
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
            detailsFailingIndexes: [2],
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

    it('counts nothing but a failed account when the backend cannot be reached', async () => {
        const { result, discoveredAccounts } = await discover({
            usedIndexes: [],
            accountInfoFailingIndexes: [0, 1],
        });

        expect(discoveredAccounts).toEqual([{ index: 0, failed: true }]);
        expect(result).toEqual({ empty: 0, nonempty: 0, failed: 1 });
    });

    it('asks to read each account, and only the basic details of the one after an empty account', async () => {
        const { requests } = await discover({ usedIndexes: [] });

        expect(requests).toEqual([
            { coin: 'btc', descriptor: '0', details: 'txs' },
            { coin: 'btc', descriptor: '1', details: 'basic' },
        ]);
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
