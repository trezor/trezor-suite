import {
    DEFAULT_CARDANO_PROTOCOL_PARAMS,
    getProtocolParamsDrift,
    resolveProtocolParams,
} from './protocolParams';

describe('resolveProtocolParams', () => {
    it('returns the defaults when nothing is supplied', () => {
        expect(resolveProtocolParams()).toEqual(DEFAULT_CARDANO_PROTOCOL_PARAMS);
    });

    it('overlays only the supplied values on top of the defaults', () => {
        expect(resolveProtocolParams({ keyDeposit: '5000000' })).toEqual({
            ...DEFAULT_CARDANO_PROTOCOL_PARAMS,
            keyDeposit: '5000000',
        });
    });
});

describe('getProtocolParamsDrift', () => {
    it('reports nothing when the live values match the compiled defaults', () => {
        expect(getProtocolParamsDrift(DEFAULT_CARDANO_PROTOCOL_PARAMS)).toEqual([]);
    });

    it('reports nothing for an empty set of live values', () => {
        expect(getProtocolParamsDrift({})).toEqual([]);
    });

    it('reports the parameters that moved, and only those', () => {
        expect(
            getProtocolParamsDrift({
                minFeeA: '57',
                minFeeB: DEFAULT_CARDANO_PROTOCOL_PARAMS.minFeeB,
                maxTxSize: 32768,
            }),
        ).toEqual([
            { param: 'minFeeA', live: '57', compiled: '44' },
            { param: 'maxTxSize', live: 32768, compiled: 16384 },
        ]);
    });

    it('compares by value, so a numeric live value does not look like drift', () => {
        expect(getProtocolParamsDrift({ minFeeA: 44 as unknown as string })).toEqual([]);
    });
});
