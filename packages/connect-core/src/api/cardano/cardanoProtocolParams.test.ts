import type { types } from '@trezor/network-cardano/types';

import { clearCardanoProtocolParamsCache, getCardanoProtocolParams } from './cardanoProtocolParams';
import { assertBackendSupported, initBlockchain } from '../../backend/BlockchainLink';
import { getCoinInfoOrThrow } from '../../data/coinInfo';

jest.mock('../../backend/BlockchainLink', () => ({
    initBlockchain: jest.fn(),
    assertBackendSupported: jest.fn(),
}));

jest.mock('../../data/coinInfo', () => ({
    getCoinInfoOrThrow: jest.fn(),
}));

const defaults: types.ProtocolParams = {
    minFeeA: '44',
    minFeeB: '155381',
    keyDeposit: '2000000',
    poolDeposit: '500000000',
    coinsPerUtxoByte: '4310',
    maxValueSize: 5000,
    maxTxSize: 16384,
};

const liveParams = {
    epoch: 700,
    minFeeA: '50',
    minFeeB: '160000',
    keyDeposit: '3000000',
    poolDeposit: '600000000',
    coinsPerUtxoByte: '5000',
    maxValueSize: 6000,
    maxTxSize: 20000,
};

const postMessage = jest.fn();
const getCardanoProtocolParameters = jest.fn();

const resolveParams = (testnet = false) =>
    getCardanoProtocolParams({ testnet, postMessage, defaults });

describe('getCardanoProtocolParams', () => {
    let warn: jest.SpyInstance;

    beforeEach(() => {
        jest.useFakeTimers();
        clearCardanoProtocolParamsCache();
        warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        jest.mocked(getCoinInfoOrThrow).mockImplementation(
            coin => ({ shortcut: coin.toUpperCase() }) as any,
        );
        jest.mocked(assertBackendSupported).mockImplementation(() => undefined);
        jest.mocked(initBlockchain).mockResolvedValue({ getCardanoProtocolParameters } as any);
        getCardanoProtocolParameters.mockResolvedValue(liveParams);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
        warn.mockRestore();
    });

    it('maps live backend parameters', async () => {
        await expect(resolveParams()).resolves.toEqual({
            minFeeA: '50',
            minFeeB: '160000',
            keyDeposit: '3000000',
            poolDeposit: '600000000',
            coinsPerUtxoByte: '5000',
            maxValueSize: 6000,
            maxTxSize: 20000,
        });
        expect(getCoinInfoOrThrow).toHaveBeenCalledWith('ada');
        expect(initBlockchain).toHaveBeenCalledWith({ shortcut: 'ADA' }, postMessage);
    });

    it('resolves the testnet backend', async () => {
        await resolveParams(true);

        expect(getCoinInfoOrThrow).toHaveBeenCalledWith('tada');
    });

    it('fills nullable fields from the defaults', async () => {
        getCardanoProtocolParameters.mockResolvedValue({
            ...liveParams,
            coinsPerUtxoByte: null,
            maxValueSize: null,
        });

        await expect(resolveParams()).resolves.toMatchObject({
            coinsPerUtxoByte: '4310',
            maxValueSize: 5000,
        });
    });

    it('warns when live parameters drift from the defaults', async () => {
        await resolveParams();

        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('differ from the compiled-in defaults'),
            expect.objectContaining({ keyDeposit: { live: '3000000', default: '2000000' } }),
        );
    });

    it('does not warn when live parameters match the defaults', async () => {
        getCardanoProtocolParameters.mockResolvedValue({ epoch: 656, ...defaults });

        await expect(resolveParams()).resolves.toEqual(defaults);
        expect(warn).not.toHaveBeenCalled();
    });

    it('caches the result and refetches after the cache expires', async () => {
        await resolveParams();
        await resolveParams();
        expect(getCardanoProtocolParameters).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(11 * 60 * 1000);
        await resolveParams();
        expect(getCardanoProtocolParameters).toHaveBeenCalledTimes(2);
    });

    it('caches mainnet and testnet separately', async () => {
        await resolveParams();
        await resolveParams(true);

        expect(getCardanoProtocolParameters).toHaveBeenCalledTimes(2);
    });

    it('returns the defaults when the network has no backend', async () => {
        jest.mocked(assertBackendSupported).mockImplementation(() => {
            throw new Error('Backend_NotSupported');
        });

        await expect(resolveParams(true)).resolves.toBe(defaults);
        expect(initBlockchain).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
    });

    it('returns the defaults when the backend call fails', async () => {
        getCardanoProtocolParameters.mockRejectedValue(new Error('Backend_Error'));

        await expect(resolveParams()).resolves.toBe(defaults);
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('could not be fetched'),
            'Backend_Error',
        );
    });

    it('does not cache a failed fetch', async () => {
        getCardanoProtocolParameters.mockRejectedValueOnce(new Error('Backend_Error'));

        await resolveParams();
        await expect(resolveParams()).resolves.toMatchObject({ keyDeposit: '3000000' });
        expect(getCardanoProtocolParameters).toHaveBeenCalledTimes(2);
    });
});
