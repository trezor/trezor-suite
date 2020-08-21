import { FakeTransaction } from 'ethereumjs-tx';
import { sha3 } from 'web3-utils';
import * as fixtures from '../__fixtures__/sendFormFixtures';
import {
    prepareEthereumTransaction,
    serializeEthereumTx,
    getInputState,
    calculateTotal,
    calculateMax,
    findComposeErrors,
    findValidOutputs,
    calculateEthFee,
    getFiatRate,
    buildCurrencyOption,
    buildFeeOptions,
    buildTokenOptions,
} from '../sendFormUtils';

describe('sendForm utils', () => {
    fixtures.prepareEthereumTransaction.forEach(f => {
        it(`prepareEthereumTransaction: ${f.description}`, () => {
            expect(prepareEthereumTransaction(f.txInfo)).toEqual(f.result);
        });
    });

    fixtures.serializeEthereumTx.forEach(f => {
        it(`serializeEthereumTx: ${f.description}`, () => {
            const serialized = serializeEthereumTx(f.tx);
            // verify hash using 2 different tools
            if (f.tx.chainId !== 61) {
                // ETC is not supported
                const tx = new FakeTransaction(serialized);
                const hash1 = tx.hash().toString('hex');
                expect(`0x${hash1}`).toEqual(f.result);
            }
            const hash2 = sha3(serialized);
            expect(hash2).toEqual(f.result);
        });
    });

    it('getInputState', () => {
        expect(getInputState(undefined, undefined)).toEqual(undefined);
        expect(getInputState(undefined, '')).toEqual(undefined);
        expect(getInputState(undefined, 'A')).toEqual('success');
        expect(getInputState({ type: 'validation' }, '')).toEqual('error');
    });

    it('calculateTotal', () => {
        expect(calculateTotal('1', '2')).toEqual('3');
    });

    it('calculateMax', () => {
        expect(calculateMax('2', '1')).toEqual('1');
    });

    it('findComposeErrors', () => {
        expect(findComposeErrors({})).toEqual([]);
        // @ts-ignore: params
        expect(findComposeErrors(null)).toEqual([]);
        // @ts-ignore: params
        expect(findComposeErrors(true)).toEqual([]);
        // @ts-ignore: params
        expect(findComposeErrors(1)).toEqual([]);
        // @ts-ignore: params
        expect(findComposeErrors('A')).toEqual([]);

        expect(findComposeErrors({ someField: { type: 'validate' } })).toEqual([]);
        expect(findComposeErrors({ someField: { type: 'compose' } })).toEqual(['someField']);
        expect(
            findComposeErrors({
                someField: { type: 'validate' },
                outputs: [
                    { amount: { type: 'compose' }, address: { type: 'validate' } },
                    { amount: { type: 'validate' }, address: { type: 'compose' } },
                ],
                topLevelField: { type: 'compose' },
                invalidFieldNull: null,
                invalidFieldBool: true,
                invalidFieldNumber: 1,
                invalidFieldString: 'A',
                invalidFieldEmpty: {},
                invalidArray: [null, true, 1, 'A', {}],
            }),
        ).toEqual(['outputs[0].amount', 'outputs[1].address', 'topLevelField']);
    });

    it('findValidOutputs', () => {
        // @ts-ignore: invalid params
        expect(findValidOutputs(null)).toEqual([]);
        // @ts-ignore: invalid params
        expect(findValidOutputs(true)).toEqual([]);
        // @ts-ignore: invalid params
        expect(findValidOutputs(1)).toEqual([]);
        // @ts-ignore: invalid params
        expect(findValidOutputs('A')).toEqual([]);

        expect(findValidOutputs({ outputs: [] })).toEqual([]);

        let outputs: any[] = [
            null,
            {},
            { type: 'payment', amount: '' },
            { type: 'payment', amount: '1' },
        ];
        // @ts-ignore: partial outputs
        expect(findValidOutputs({ outputs })).toEqual([{ type: 'payment', amount: '1' }]);

        outputs = [
            { type: 'payment', amount: '' },
            { type: 'payment', amount: '1' },
            { type: 'payment', amount: '', fiat: '1' },
            { type: 'opreturn', dataHex: '' },
            { type: 'opreturn', dataHex: 'deadbeef' },
        ];
        expect(
            findValidOutputs({
                setMaxOutputId: 2,
                // @ts-ignore: partial outputs
                outputs,
            }),
        ).toEqual([
            { type: 'payment', amount: '1' },
            { type: 'payment', amount: '', fiat: '1' },
            { type: 'opreturn', dataHex: 'deadbeef' },
        ]);
    });

    it('calculateEthFee', () => {
        expect(calculateEthFee()).toEqual('0');
        expect(calculateEthFee('', '')).toEqual('0');
        expect(calculateEthFee('1', '')).toEqual('0');
        expect(calculateEthFee('0', '1')).toEqual('0');
        // @ts-ignore invalid params
        expect(calculateEthFee({}, {})).toEqual('0');
        // @ts-ignore invalid params
        expect(calculateEthFee(() => {}, {})).toEqual('0');
        // @ts-ignore invalid params
        expect(calculateEthFee(null, true)).toEqual('0');
        expect(calculateEthFee('1', '2')).toEqual('2');
    });

    it('getFiatRate', () => {
        expect(getFiatRate(undefined, 'usd')).toBe(undefined);
        // @ts-ignore invalid params
        expect(getFiatRate({}, 'usd')).toBe(undefined);
        // @ts-ignore invalid params
        expect(getFiatRate({ current: {} }, 'usd')).toBe(undefined);
        // @ts-ignore invalid params
        expect(getFiatRate({ current: { rates: {} } }, 'usd')).toBe(undefined);
        // @ts-ignore invalid params
        expect(getFiatRate({ current: { rates: { usd: 1 } } }, 'usd')).toBe(1);
    });

    it('build options', () => {
        // @ts-ignore invalid params
        expect(buildTokenOptions({ symbol: 'btc' })).toEqual([{ value: undefined, label: 'BTC' }]);
        expect(
            buildTokenOptions({
                symbol: 'eth',
                // @ts-ignore invalid params
                tokens: [{ address: '0x1' }, { symbol: 'Symbol', address: '0x2' }],
            }),
        ).toEqual([
            { value: undefined, label: 'ETH' },
            { value: '0x1', label: 'N/A' },
            { value: '0x2', label: 'SYMBOL' },
        ]);

        expect(buildFeeOptions([])).toEqual([]);
        // @ts-ignore invalid params
        expect(buildFeeOptions([{ label: 'normal' }])).toEqual([
            { label: 'normal', value: 'normal' },
        ]);

        expect(buildCurrencyOption('usd')).toEqual({ value: 'usd', label: 'USD' });
    });
});
