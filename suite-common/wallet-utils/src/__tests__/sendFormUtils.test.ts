import { networksCompatibility as NETWORKS } from '@suite-common/wallet-config';
import { testMocks } from '@suite-common/test-utils';

import * as fixtures from '../__fixtures__/sendFormUtils';
import { getUtxoOutpoint } from '../accountUtils';
import {
    calculateEthFee,
    calculateMax,
    calculateTotal,
    findComposeErrors,
    getBitcoinComposeOutputs,
    getExcludedUtxos,
    getExternalComposeOutput,
    getFiatRate,
    getInputState,
    getLamportsFromSol,
    prepareEthereumTransaction,
    restoreOrigOutputsOrder,
} from '../sendFormUtils';

const { getUtxo, getWalletAccount } = testMocks;

describe('sendForm utils', () => {
    fixtures.prepareEthereumTransaction.forEach(f => {
        it(`prepareEthereumTransaction: ${f.description}`, () => {
            expect(prepareEthereumTransaction(f.txInfo)).toEqual(f.result);
        });
    });

    fixtures.restoreOrigOutputsOrder.forEach(f => {
        it(`restoreOrigOutputsOrder: ${f.description}`, () => {
            // @ts-expect-error: params are only partial
            const result = restoreOrigOutputsOrder(f.outputs, f.origOutputs, 'txid');
            expect(result).toEqual(f.result);
        });
    });

    it('getInputState', () => {
        expect(getInputState(undefined, undefined)).toEqual(undefined);
        expect(getInputState(undefined, '')).toEqual(undefined);
        expect(getInputState(undefined, 'A')).toEqual('success');
        expect(getInputState({ type: 'validation' }, '')).toEqual('error');
    });

    it('calculateTotal', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(calculateTotal('1', '2')).toEqual('3');
        expect(calculateTotal('a', '2')).toEqual('0');
        expect(spy).toHaveBeenCalledTimes(1);
        // @ts-expect-error: args are not a string
        expect(calculateTotal(null, null)).toEqual('0');
        expect(spy).toHaveBeenCalledTimes(2);
        spy.mockRestore();
    });

    it('calculateMax', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(calculateMax('2', '1')).toEqual('1');
        expect(calculateMax('2', '3')).toEqual('0');
        expect(calculateMax('a', '3')).toEqual('0');
        expect(spy).toHaveBeenCalledTimes(1);
        expect(calculateMax('2', 'a')).toEqual('0');
        expect(spy).toHaveBeenCalledTimes(2);
        // @ts-expect-error: args are not a string
        expect(calculateMax(null, null)).toEqual('0');
        expect(spy).toHaveBeenCalledTimes(3);
        spy.mockRestore();
    });

    it('findComposeErrors', () => {
        expect(findComposeErrors({})).toEqual([]);
        // @ts-expect-error: params
        expect(findComposeErrors(null)).toEqual([]);
        // @ts-expect-error: params
        expect(findComposeErrors(true)).toEqual([]);
        // @ts-expect-error: params
        expect(findComposeErrors(1)).toEqual([]);
        // @ts-expect-error: params
        expect(findComposeErrors('A')).toEqual([]);

        expect(findComposeErrors({ someField: { type: 'validate' } })).toEqual([]);
        expect(findComposeErrors({ someField: { type: 'compose' } })).toEqual(['someField']);
        expect(
            findComposeErrors({
                someField: { type: 'validate' },
                // @ts-expect-error: should not fail TODO
                outputs: [
                    { amount: { type: 'compose' }, address: { type: 'validate' } },
                    { amount: { type: 'validate' }, address: { type: 'compose' } },
                ],
                topLevelField: { type: 'compose' },
                // @ts-expect-error: params
                invalidFieldNull: null,
                // @ts-expect-error: params
                invalidFieldBool: true,
                // @ts-expect-error: params
                invalidFieldNumber: 1,
                // @ts-expect-error: params
                invalidFieldString: 'A',
                // should fail?
                invalidFieldEmpty: {},
                // @ts-expect-error: params
                invalidArray: [null, true, 1, 'A', {}],
            }),
        ).toEqual(['outputs.0.amount', 'outputs.1.address', 'topLevelField']);
    });

    it('getBitcoinComposeOutputs', () => {
        // @ts-expect-error: invalid params
        expect(getBitcoinComposeOutputs(null, 'btc')).toEqual([]);
        // @ts-expect-error: invalid params
        expect(getBitcoinComposeOutputs(true, 'btc')).toEqual([]);
        // @ts-expect-error: invalid params
        expect(getBitcoinComposeOutputs(1, 'btc')).toEqual([]);
        // @ts-expect-error: invalid params
        expect(getBitcoinComposeOutputs('A', 'btc')).toEqual([]);

        expect(getBitcoinComposeOutputs({ outputs: [] }, 'btc')).toEqual([]);

        let outputs: any[] = [
            null,
            {},
            { type: 'payment', amount: '' },
            { type: 'payment', amount: '1' },
        ];
        expect(getBitcoinComposeOutputs({ outputs }, 'btc')).toEqual([
            { type: 'payment-noaddress', amount: '100000000' },
        ]);
        expect(getBitcoinComposeOutputs({ outputs }, 'btc', true)).toEqual([
            { type: 'payment-noaddress', amount: '1' },
        ]);

        outputs = [
            { type: 'payment', amount: '' },
            { type: 'payment', amount: '1', address: 'A' },
            { type: 'payment', amount: '1' },
            { type: 'payment', amount: '2' },
            { type: 'payment', amount: '', fiat: '1' },
            { type: 'opreturn' },
            { type: 'opreturn', dataHex: '' },
            { type: 'opreturn', dataHex: 'deadbeef' },
        ];
        expect(
            getBitcoinComposeOutputs(
                {
                    setMaxOutputId: 2,
                    outputs,
                },
                'btc',
            ),
        ).toEqual([
            { type: 'payment', amount: '100000000', address: 'A' },
            { type: 'send-max-noaddress' },
            { type: 'payment-noaddress', amount: '200000000' },
            { type: 'opreturn', dataHex: 'deadbeef' },
        ]);

        outputs = [{ type: 'payment', amount: '' }];
        expect(
            getBitcoinComposeOutputs(
                {
                    setMaxOutputId: 0,
                    outputs,
                },
                'btc',
            ),
        ).toEqual([{ type: 'send-max-noaddress' }]);

        outputs = [{ type: 'payment', amount: '', address: 'A' }];
        expect(
            getBitcoinComposeOutputs(
                {
                    setMaxOutputId: 0,
                    outputs,
                },
                'btc',
            ),
        ).toEqual([{ type: 'send-max', address: 'A' }]);

        // edge case, final Output are changed to not-final
        outputs = [
            { type: 'payment', amount: '', address: 'A' },
            { type: 'payment', amount: '1', address: 'B' },
        ];
        expect(getBitcoinComposeOutputs({ outputs }, 'btc')).toEqual([
            { type: 'payment-noaddress', amount: '100000000', address: 'B' },
        ]);

        // edge case, final Output are changed to not-final
        outputs = [
            { type: 'payment', amount: '', address: 'A' },
            { type: 'payment', amount: '', address: 'B' },
        ];
        expect(
            getBitcoinComposeOutputs(
                {
                    setMaxOutputId: 1,
                    outputs,
                },
                'btc',
            ),
        ).toEqual([{ type: 'send-max-noaddress', address: 'B' }]);

        outputs = [
            { type: 'payment', amount: '', address: 'A' },
            { type: 'payment', amount: '1' },
        ];
        expect(getBitcoinComposeOutputs({ outputs }, 'btc')).toEqual([
            { type: 'payment-noaddress', amount: '100000000' },
        ]);
    });

    it('getExternalComposeOutput', () => {
        // @ts-expect-error: invalid params
        expect(getExternalComposeOutput(null)).toEqual(undefined);
        // @ts-expect-error: invalid params
        expect(getExternalComposeOutput(true)).toEqual(undefined);
        // @ts-expect-error: invalid params
        expect(getExternalComposeOutput(1)).toEqual(undefined);
        // @ts-expect-error: invalid params
        expect(getExternalComposeOutput('A')).toEqual(undefined);
        expect(
            // @ts-expect-error: invalid params
            getExternalComposeOutput({ outputs: [null] }),
        ).toEqual(undefined);
        expect(
            // @ts-expect-error: invalid params
            getExternalComposeOutput({ outputs: [1] }),
        ).toEqual(undefined);
        expect(
            // @ts-expect-error: invalid params
            getExternalComposeOutput({ outputs: ['A'] }),
        ).toEqual(undefined);
        expect(
            // @ts-expect-error: invalid params
            getExternalComposeOutput({ outputs: [{}] }),
        ).toEqual(undefined);

        const OUTPUT: any = {
            type: 'payment',
        };

        const EthAccount = getWalletAccount({
            tokens: [
                { type: 'ERC20', contract: 'A', symbol: 'A', decimals: 2, name: 'A' },
                { type: 'ERC20', contract: 'B', symbol: 'B', decimals: 6, name: 'B' },
            ],
        });
        const EthNetwork: any = NETWORKS.find(n => n.symbol === 'eth');
        const XrpNetwork: any = NETWORKS.find(n => n.symbol === 'xrp');

        expect(getExternalComposeOutput({ outputs: [] }, EthAccount, EthNetwork)).toEqual(
            undefined,
        );

        expect(
            getExternalComposeOutput(
                { outputs: [{ ...OUTPUT, address: 'A' }] },
                EthAccount,
                EthNetwork,
            ),
        ).toEqual(undefined);

        expect(
            getExternalComposeOutput(
                { outputs: [{ ...OUTPUT, amount: '1' }] },
                EthAccount,
                EthNetwork,
            ),
        ).toEqual({
            decimals: 18,
            output: { type: 'payment-noaddress', amount: '1000000000000000000' },
            tokenInfo: undefined,
        });

        expect(
            getExternalComposeOutput(
                { outputs: [{ ...OUTPUT, address: 'A', amount: '1' }] },
                EthAccount,
                EthNetwork,
            ),
        ).toEqual({
            decimals: 18,
            output: { type: 'payment', address: 'A', amount: '1000000000000000000' },
            tokenInfo: undefined,
        });

        expect(
            getExternalComposeOutput(
                { outputs: [{ ...OUTPUT, amount: '' }], setMaxOutputId: 0 },
                EthAccount,
                EthNetwork,
            ),
        ).toEqual({
            decimals: 18,
            output: { type: 'send-max-noaddress' },
            tokenInfo: undefined,
        });

        expect(
            getExternalComposeOutput(
                { outputs: [{ ...OUTPUT, address: 'A', amount: '1' }], setMaxOutputId: 0 },
                EthAccount,
                EthNetwork,
            ),
        ).toEqual({
            decimals: 18,
            output: { type: 'send-max', address: 'A' },
            tokenInfo: undefined,
        });

        expect(
            getExternalComposeOutput(
                { outputs: [{ ...OUTPUT, address: 'A', amount: '1', token: 'A' }] },
                EthAccount,
                EthNetwork,
            ),
        ).toEqual({
            decimals: 2,
            output: { type: 'payment', address: 'A', amount: '100' },
            tokenInfo: EthAccount.tokens![0],
        });

        expect(
            getExternalComposeOutput(
                { outputs: [{ ...OUTPUT, amount: '1' }] },
                EthAccount,
                XrpNetwork,
            ),
        ).toEqual({
            decimals: 6,
            output: { type: 'payment-noaddress', amount: '1000000' },
            tokenInfo: undefined,
        });
    });

    it('calculateEthFee', () => {
        expect(calculateEthFee()).toEqual('0');
        expect(calculateEthFee('', '')).toEqual('0');
        expect(calculateEthFee('1', '')).toEqual('0');
        expect(calculateEthFee('0', '1')).toEqual('0');
        // @ts-expect-error invalid params
        expect(calculateEthFee({}, {})).toEqual('0');
        // @ts-expect-error invalid params
        expect(calculateEthFee(() => {}, {})).toEqual('0');
        // @ts-expect-error invalid params
        expect(calculateEthFee(null, true)).toEqual('0');
        expect(calculateEthFee('1', '2')).toEqual('2');
    });

    it('getFiatRate', () => {
        expect(getFiatRate(undefined, 'usd')).toBe(undefined);
        // @ts-expect-error invalid params
        expect(getFiatRate({}, 'usd')).toBe(undefined);
        // @ts-expect-error invalid params
        expect(getFiatRate({ current: {} }, 'usd')).toBe(undefined);
        // @ts-expect-error invalid params
        expect(getFiatRate({ current: { rates: {} } }, 'usd')).toBe(undefined);
        // @ts-expect-error invalid params
        expect(getFiatRate({ current: { rates: { usd: 1 } } }, 'usd')).toBe(1);
    });

    it('getExcludedUtxos', () => {
        const dustUtxo = getUtxo({
            address: 'two',
            amount: '1',
            vout: 1,
        });
        const lowAnonymityDustUtxo = getUtxo({
            address: 'one',
            amount: '100',
            vout: 2,
        });
        const lowAnonymityUtxo = getUtxo({
            address: 'one',
            amount: '1000',
            vout: 3,
        });
        const spendableUtxo = getUtxo({
            address: 'two',
            amount: '546',
            vout: 4,
        });

        const excludedUtxos = getExcludedUtxos({
            utxos: [dustUtxo, lowAnonymityDustUtxo, lowAnonymityUtxo, spendableUtxo],
            anonymitySet: { one: 1, two: 2 },
            targetAnonymity: 2,
            dustLimit: 546,
        });

        expect(excludedUtxos[getUtxoOutpoint(dustUtxo)]).toBe('dust');
        expect(excludedUtxos[getUtxoOutpoint(lowAnonymityDustUtxo)]).toBe('dust');
        expect(excludedUtxos[getUtxoOutpoint(lowAnonymityUtxo)]).toBe('low-anonymity');
        expect(excludedUtxos[getUtxoOutpoint(spendableUtxo)]).toBe(undefined);
    });

    it('getLamportsFromSol', () => {
        expect(getLamportsFromSol('1')).toEqual(1000000000n);
        expect(getLamportsFromSol('0.000000001')).toEqual(1n);
    });
});
