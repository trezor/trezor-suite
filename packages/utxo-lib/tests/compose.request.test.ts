import { validateAndParseRequest as validate } from '../src/compose/request';
import { ComposeRequest } from '../src';
import * as NETWORKS from '../src/networks';

const UTXO = {
    coinbase: false,
    own: true,
    confirmations: 100,
    amount: '50000',
};

const PAYMENT = {
    type: 'send-max-noaddress',
};

const REQUEST: ComposeRequest<any, any, any> = {
    utxos: [UTXO],
    outputs: [PAYMENT],
    feeRate: 1,
    network: NETWORKS.bitcoin,
    changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
    dustThreshold: 526,
};

describe('validateAndParseRequest', () => {
    it('validate feeRate', () => {
        const getRequest = (feeRate: any) => validate({ ...REQUEST, feeRate });
        // valid
        expect(getRequest('1')).toMatchObject({ feeRate: 1 });
        expect(getRequest('1.1')).toMatchObject({ feeRate: 1.1 });
        expect(getRequest(1)).toMatchObject({ feeRate: 1 });
        expect(getRequest(1.1)).toMatchObject({ feeRate: 1.1 });

        // invalid
        const expectedError = { type: 'error', error: 'INCORRECT-FEE-RATE' };
        expect(getRequest(Number.MAX_SAFE_INTEGER + 1)).toEqual(expectedError);
        expect(getRequest('9007199254740992')).toEqual(expectedError); // Number.MAX_SAFE_INTEGER + 1 as string
        expect(getRequest('-1')).toEqual(expectedError);
        expect(getRequest(-1)).toEqual(expectedError);
        expect(getRequest('0')).toEqual(expectedError);
        expect(getRequest(0)).toEqual(expectedError);
        expect(getRequest('foobar')).toEqual(expectedError);
        expect(getRequest('')).toEqual(expectedError);
        expect(getRequest(NaN)).toEqual(expectedError);
        expect(getRequest(Infinity)).toEqual(expectedError);
        expect(getRequest(undefined)).toEqual(expectedError);
        expect(getRequest(null)).toEqual(expectedError);
        expect(getRequest({ value: 1 })).toEqual(expectedError);
    });

    it('validate longTermFeeRate', () => {
        const getRequest = (longTermFeeRate: any) => validate({ ...REQUEST, longTermFeeRate });
        // valid
        expect(getRequest('1')).toMatchObject({ longTermFeeRate: 1 });
        expect(getRequest('1.1')).toMatchObject({ longTermFeeRate: 1.1 });
        expect(getRequest(1)).toMatchObject({ longTermFeeRate: 1 });
        expect(getRequest(1.1)).toMatchObject({ longTermFeeRate: 1.1 });
        expect(getRequest(undefined)).toMatchObject({
            longTermFeeRate: undefined,
        });

        // invalid, should fail in the same cases as validate feeRate
        const expectedError = { type: 'error', error: 'INCORRECT-FEE-RATE' };
        expect(getRequest(Number.MAX_SAFE_INTEGER + 1)).toEqual(expectedError);
        expect(getRequest('foobar')).toEqual(expectedError);
    });

    it('validate utxos', () => {
        const getRequest = (utxos: any) => validate({ ...REQUEST, utxos });

        const expectedError = { type: 'error', error: 'INCORRECT-UTXO' };
        // missing coinbase field
        expect(getRequest([{ ...UTXO, coinbase: undefined }])).toEqual({
            ...expectedError,
            message: 'Missing coinbase at index 0',
        });
        // missing own field
        expect(getRequest([{ ...UTXO, own: undefined }])).toEqual({
            ...expectedError,
            message: 'Missing own at index 0',
        });
        // missing confirmations field
        expect(getRequest([{ ...UTXO, confirmations: undefined }])).toEqual({
            ...expectedError,
            message: 'Missing confirmations at index 0',
        });
        // missing amount field
        expect(getRequest([{ ...UTXO, amount: undefined }])).toEqual({
            ...expectedError,
            message: 'Missing amount at index 0',
        });
    });

    it('validate outputs', () => {
        const getRequest = (outputs: any) => validate({ ...REQUEST, outputs });

        // missing outputs
        expect(getRequest([])).toEqual({ type: 'error', error: 'MISSING-OUTPUTS' });

        const expectedError = { type: 'error', error: 'INCORRECT-OUTPUT' };
        // two send-max
        expect(
            getRequest([
                { ...PAYMENT, type: 'send-max-noaddress' },
                { ...PAYMENT, type: 'send-max' },
            ]),
        ).toEqual({
            ...expectedError,
            message: 'Multiple send-max at index 1',
        });

        // unknown output type
        expect(getRequest([{ ...PAYMENT, type: 'weird-output-type' }])).toEqual({
            ...expectedError,
            message: 'Unknown output type at index 0',
        });

        // invalid address
        expect(getRequest([{ type: 'send-max', address: 'weird-address' }])).toEqual({
            ...expectedError,
            message: 'weird-address has no matching Script at index 0',
        });

        // missing amount
        expect(getRequest([{ type: 'payment-noaddress' }])).toEqual({
            ...expectedError,
            message: 'Missing output amount at index 0',
        });
    });
});
