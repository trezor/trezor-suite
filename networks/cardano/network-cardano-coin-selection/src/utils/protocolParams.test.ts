import { DEFAULT_PROTOCOL_PARAMS, getDataCost, getProtocolParams } from './protocolParams';
import { mockProtocolParams } from '../../mocks/mockProtocolParams';

describe('protocolParams', () => {
    test('falls back to the compiled-in defaults', () => {
        expect(getProtocolParams()).toStrictEqual(DEFAULT_PROTOCOL_PARAMS);
        expect(getProtocolParams({})).toStrictEqual(DEFAULT_PROTOCOL_PARAMS);
    });

    test('uses the provided protocol params', () => {
        const protocolParams = mockProtocolParams({
            minFeeA: '50',
            minFeeB: '160000',
            keyDeposit: '3000000',
            poolDeposit: '600000000',
            coinsPerUtxoByte: '5000',
            maxValueSize: 6000,
            maxTxSize: 20000,
        });

        expect(getProtocolParams({ protocolParams })).toStrictEqual(protocolParams);
    });

    test('feeParams.a overrides minFeeA only', () => {
        const protocolParams = mockProtocolParams({ minFeeA: '50', minFeeB: '160000' });

        expect(getProtocolParams({ protocolParams, feeParams: { a: '0' } })).toStrictEqual({
            ...protocolParams,
            minFeeA: '0',
        });
        expect(getProtocolParams({ feeParams: { a: '100' } })).toStrictEqual({
            ...DEFAULT_PROTOCOL_PARAMS,
            minFeeA: '100',
        });
    });

    test('getDataCost reflects coinsPerUtxoByte', () => {
        expect(getDataCost(DEFAULT_PROTOCOL_PARAMS).coins_per_byte().to_str()).toBe(
            DEFAULT_PROTOCOL_PARAMS.coinsPerUtxoByte,
        );
        expect(
            getDataCost(mockProtocolParams({ coinsPerUtxoByte: '8620' }))
                .coins_per_byte()
                .to_str(),
        ).toBe('8620');
    });
});
