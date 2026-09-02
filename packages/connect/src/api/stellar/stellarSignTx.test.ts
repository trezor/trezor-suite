import type { StellarTransaction } from '@trezor/connect-common';
import stellar from '@trezor/network-stellar/runtime';

import { stellarSignTx } from './stellarSignTx';
import type { TypedCall } from '../../device/DeviceCommands';

const ADDRESS_N = [2147483692, 2147483796, 2147483648];
const NETWORK_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
const SOURCE = 'GBRF6PKZYP4J4WI2A3NF4CGF23SL34GRKA5LTQZCQFEUT2YJDZO2COXH';
const CONTRACT = 'CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM';
const SIGNED_TX = { public_key: 'pubkey', signature: 'signature' };

// transfer(holder, contract, i128, symbol) with one signed address-credentials auth entry,
// soroban data and a nonce wider than Number.MAX_SAFE_INTEGER
const SOROBAN_XDR =
    'AAAAAgAAAABiXz1Zw/ieWRoG2l4IxdbkvfDRUDq5wyKBSUnrCR5doQAAMJ0Bb2zHAAAFkQAAAAEAAAAAX14QAAAAAABlU/EAAAAAAAAAAAEAAAAAAAAAGAAAAAAAAAABJbKv015UMxpIkMNjGfee2xjweJ5H/Dh7OzDvLmmlTRoAAAAIdHJhbnNmZXIAAAAEAAAAEgAAAAAAAAAAtGn4J8Joof5VAq9VhwERFiPjv/iBdLOwbVZIjMUu/rgAAAASAAAAASWyr9NeVDMaSJDDYxn3ntsY8HieR/w4ezsw7y5ppU0aAAAACgAAAAAAAQVuDzamRD3i33kAAAAPAAAABG1lbW8AAAABAAAAAgAAAAAAAAAAtGn4J8Joof5VAq9VhwERFiPjv/iBdLOwbVZIjMUu/rhkPpKYsTf//wAPEgYAAAAQAAAAAQAAAAEAAAAPAAAAA3NpZwAAAAAAAAAAASWyr9NeVDMaSJDDYxn3ntsY8HieR/w4ezsw7y5ppU0aAAAACHRyYW5zZmVyAAAABAAAABIAAAAAAAAAALRp+CfCaKH+VQKvVYcBERYj47/4gXSzsG1WSIzFLv64AAAAEgAAAAElsq/TXlQzGkiQw2MZ957bGPB4nkf8OHs7MO8uaaVNGgAAAAoAAAAAAAEFbg82pkQ94t95AAAADwAAAARtZW1vAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwOQAAAAA=';

const baseTransaction = {
    source: SOURCE,
    fee: 100,
    sequence: '1',
    timebounds: { minTime: 0, maxTime: 1700000000 },
};

const invokeContractOperation = {
    type: 'invokeHostFunction' as const,
    function: {
        type: 0,
        invoke_contract: { contract_address: CONTRACT, function_name: 'transfer', args: [] },
    },
    auth: [],
};

/** Answers each call with the response the device would send at that point of the flow. */
const mockTypedCall = (responses: string[]) => {
    const calls: { type: string; message: unknown }[] = [];
    const typedCall = jest.fn((type: string, _resType: unknown, message: unknown) => {
        calls.push({ type, message });
        const responseType = responses[calls.length - 1];

        return Promise.resolve({
            type: responseType,
            message: responseType === 'StellarSignedTx' ? SIGNED_TX : {},
        });
    });

    return { calls, typedCall: typedCall as unknown as TypedCall };
};

describe('stellarSignTx', () => {
    it('sends the contract invocation and the transaction extension the device asks for', async () => {
        const { calls, typedCall } = mockTypedCall([
            'StellarTxOpRequest',
            'StellarTxExtRequest',
            'StellarSignedTx',
        ]);

        const sorobanData = Buffer.from('0000000100000002deadbeef', 'hex');
        const transaction: StellarTransaction = {
            ...baseTransaction,
            operations: [invokeContractOperation],
            ext: { v: 1, sorobanData: sorobanData.toString('base64') },
        };

        const signed = await stellarSignTx(typedCall, ADDRESS_N, NETWORK_PASSPHRASE, transaction);

        expect(calls.map(call => call.type)).toEqual([
            'StellarSignTx',
            'StellarInvokeHostFunctionOp',
            'StellarTxExt',
        ]);
        expect(calls[1]!.message).toEqual({
            source_account: undefined,
            function: invokeContractOperation.function,
            auth: [],
        });
        // hex, not the base64 the caller passes: a bytes field encoded from base64 reaches the
        // device truncated to garbage
        expect(calls[2]!.message).toEqual({
            v: 1,
            soroban_data: '0000000100000002deadbeef',
        });
        expect(signed).toEqual(SIGNED_TX);
    });

    it('refuses to sign when the soroban data the device asked for is missing', async () => {
        const { typedCall } = mockTypedCall([
            'StellarTxOpRequest',
            'StellarTxExtRequest',
            'StellarSignedTx',
        ]);

        await expect(
            stellarSignTx(typedCall, ADDRESS_N, NETWORK_PASSPHRASE, {
                ...baseTransaction,
                operations: [invokeContractOperation],
            }),
        ).rejects.toThrow('missing the Soroban transaction data');
    });

    it('signs a transaction parsed straight from a dApp envelope', async () => {
        const { parseTransactionFromXDR, transformTransaction } = await stellar();
        const transaction = transformTransaction(parseTransactionFromXDR(SOROBAN_XDR, false));
        const { calls, typedCall } = mockTypedCall([
            'StellarTxOpRequest',
            'StellarTxExtRequest',
            'StellarSignedTx',
        ]);

        // every message is validated against the protobuf schema on the way out, so this covers
        // the whole chain: XDR -> device messages
        await stellarSignTx(typedCall, ADDRESS_N, NETWORK_PASSPHRASE, transaction);

        expect(calls.map(call => call.type)).toEqual([
            'StellarSignTx',
            'StellarInvokeHostFunctionOp',
            'StellarTxExt',
        ]);

        const [{ credentials }] = (calls[1]!.message as { auth: any[] }).auth;
        expect(credentials.address_v2.nonce).toBe('7223372036854775807');
        const { soroban_data: sorobanData } = calls[2]!.message as { soroban_data: string };
        const envelopeData = parseTransactionFromXDR(SOROBAN_XDR, false)
            .toEnvelope()
            .v1()
            .tx()
            .ext()
            .sorobanData()
            .toXDR('hex');
        expect(sorobanData).toBe(envelopeData);
    });

    it('does not send an extension for a classic transaction', async () => {
        const { calls, typedCall } = mockTypedCall(['StellarTxOpRequest', 'StellarSignedTx']);

        const signed = await stellarSignTx(typedCall, ADDRESS_N, NETWORK_PASSPHRASE, {
            ...baseTransaction,
            operations: [
                {
                    type: 'payment',
                    destination: SOURCE,
                    asset: { type: 0 },
                    amount: '100',
                },
            ],
        });

        expect(calls.map(call => call.type)).toEqual(['StellarSignTx', 'StellarPaymentOp']);
        expect(signed).toEqual(SIGNED_TX);
    });
});
