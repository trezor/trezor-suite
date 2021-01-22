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
    calculateEthFee,
    getFiatRate,
    getBitcoinComposeOutputs,
    getExternalComposeOutput,
} from '../sendFormUtils';
import { NETWORKS } from '@wallet-config';

const { getWalletAccount } = global.JestMocks;

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
        expect(calculateTotal('a', '2')).toEqual('0');
        // @ts-ignore not a string
        expect(calculateTotal(null, null)).toEqual('0');
    });

    it('calculateMax', () => {
        expect(calculateMax('2', '1')).toEqual('1');
        expect(calculateMax('2', '3')).toEqual('0');
        // @ts-ignore not a string
        expect(calculateMax(null, null)).toEqual('0');
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

    it('getBitcoinComposeOutputs', () => {
        // @ts-ignore: invalid params
        expect(getBitcoinComposeOutputs(null, 'btc')).toEqual([]);
        // @ts-ignore: invalid params
        expect(getBitcoinComposeOutputs(true, 'btc')).toEqual([]);
        // @ts-ignore: invalid params
        expect(getBitcoinComposeOutputs(1, 'btc')).toEqual([]);
        // @ts-ignore: invalid params
        expect(getBitcoinComposeOutputs('A', 'btc')).toEqual([]);

        expect(getBitcoinComposeOutputs({ outputs: [] }, 'btc')).toEqual([]);

        let outputs: any[] = [
            null,
            {},
            { type: 'payment', amount: '' },
            { type: 'payment', amount: '1' },
        ];
        expect(getBitcoinComposeOutputs({ outputs }, 'btc')).toEqual([
            { type: 'noaddress', amount: '100000000' },
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
            { type: 'external', amount: '100000000', address: 'A' },
            { type: 'send-max-noaddress' },
            { type: 'noaddress', amount: '200000000' },
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
            { type: 'noaddress', amount: '100000000', address: 'B' },
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
            { type: 'noaddress', amount: '100000000' },
        ]);
    });

    it('getExternalComposeOutput', () => {
        // @ts-ignore: invalid params
        expect(getExternalComposeOutput(null)).toEqual(undefined);
        // @ts-ignore: invalid params
        expect(getExternalComposeOutput(true)).toEqual(undefined);
        // @ts-ignore: invalid params
        expect(getExternalComposeOutput(1)).toEqual(undefined);
        // @ts-ignore: invalid params
        expect(getExternalComposeOutput('A')).toEqual(undefined);
        expect(
            // @ts-ignore: invalid params
            getExternalComposeOutput({ outputs: [null] }),
        ).toEqual(undefined);
        expect(
            // @ts-ignore: invalid params
            getExternalComposeOutput({ outputs: [1] }),
        ).toEqual(undefined);
        expect(
            // @ts-ignore: invalid params
            getExternalComposeOutput({ outputs: ['A'] }),
        ).toEqual(undefined);
        expect(
            // @ts-ignore: invalid params
            getExternalComposeOutput({ outputs: [{}] }),
        ).toEqual(undefined);

        const OUTPUT: any = {
            type: 'payment',
        };

        const EthAccount = getWalletAccount({
            tokens: [
                { type: 'ERC20', address: 'A', symbol: 'A', decimals: 2 },
                { type: 'ERC20', address: 'B', symbol: 'B', decimals: 6 },
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
            output: { type: 'noaddress', amount: '1000000000000000000' },
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
            output: { type: 'external', address: 'A', amount: '1000000000000000000' },
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
            output: { type: 'external', address: 'A', amount: '100' },
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
            output: { type: 'noaddress', amount: '1000000' },
            tokenInfo: undefined,
        });
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
});
