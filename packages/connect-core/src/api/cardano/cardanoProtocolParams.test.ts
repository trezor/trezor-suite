import type { CardanoProtocolParameters } from '@trezor/blockchain-link-types';
import type { types } from '@trezor/network-cardano/types';

import { getCardanoProtocolParams } from './cardanoProtocolParams';

const defaults: types.ProtocolParams = {
    minFeeA: '44',
    minFeeB: '155381',
    keyDeposit: '2000000',
    poolDeposit: '500000000',
    coinsPerUtxoByte: '4310',
    maxValueSize: 5000,
    maxTxSize: 16384,
};

// The drift is reported once per epoch, so each test reports a different one.
const mockLiveParams = (epoch: number): CardanoProtocolParameters => ({
    epoch,
    minFeeA: '50',
    minFeeB: '160000',
    keyDeposit: '3000000',
    poolDeposit: '600000000',
    coinsPerUtxoByte: '5000',
    maxValueSize: 6000,
    maxTxSize: 20000,
});

describe('getCardanoProtocolParams', () => {
    let warn: jest.SpyInstance;

    beforeEach(() => {
        warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        warn.mockRestore();
    });

    it('returns the defaults without live parameters', () => {
        expect(getCardanoProtocolParams(undefined, defaults)).toBe(defaults);
        expect(warn).not.toHaveBeenCalled();
    });

    it('maps live parameters', () => {
        expect(getCardanoProtocolParams(mockLiveParams(700), defaults)).toEqual({
            minFeeA: '50',
            minFeeB: '160000',
            keyDeposit: '3000000',
            poolDeposit: '600000000',
            coinsPerUtxoByte: '5000',
            maxValueSize: 6000,
            maxTxSize: 20000,
        });
    });

    it('fills nullable fields from the defaults', () => {
        expect(
            getCardanoProtocolParams(
                { ...mockLiveParams(701), coinsPerUtxoByte: null, maxValueSize: null },
                defaults,
            ),
        ).toMatchObject({ coinsPerUtxoByte: '4310', maxValueSize: 5000 });
    });

    it('warns when live parameters drift from the defaults', () => {
        getCardanoProtocolParams(mockLiveParams(702), defaults);

        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('differ from the compiled-in defaults'),
            expect.objectContaining({ keyDeposit: { live: '3000000', default: '2000000' } }),
        );
    });

    it('does not warn when live parameters match the defaults', () => {
        expect(getCardanoProtocolParams({ epoch: 704, ...defaults }, defaults)).toEqual(defaults);
        expect(warn).not.toHaveBeenCalled();
    });
});
