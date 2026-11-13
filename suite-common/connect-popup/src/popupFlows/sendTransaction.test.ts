import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { notificationsActions } from '@suite-common/toast-notifications';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect, {
    type PrecomposeResultFinal,
    UI_REQUESTS,
    asCoinSymbol,
} from '@trezor/connect';

import { SendTransaction } from './sendTransaction';
import { SignTransaction } from './signTransaction';
import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import {
    CALL_SOURCE_DEEPLINK,
    type ConnectCallSource,
    type SelectFeeChoice,
} from '../connectPopupTypes';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: {
        getCoinInfo: () => Promise.resolve({ success: true, payload: { type: 'bitcoin' } }),
        getPublicKey: jest.fn(() =>
            Promise.resolve({ success: true, payload: { xpub: 'xpub', xpubSegwit: 'descriptor' } }),
        ),
        composeTransaction: jest.fn(),
    },
}));
jest.mock('@trezor/blockchain-core', () => ({
    TrezorBlockchain: {
        getAccountInfo: jest.fn(() =>
            Promise.resolve({
                success: true,
                payload: {
                    utxo: [{ txid: 'txid', vout: 0, amount: '5000' }],
                    addresses: {
                        change: [
                            { address: 'used', path: "m/84'/0'/0'/1/0", transfers: 1 },
                            { address: 'unused', path: "m/84'/0'/0'/1/1", transfers: 0 },
                        ],
                    },
                },
            }),
        ),
        estimateFee: () =>
            Promise.resolve({
                success: true,
                payload: {
                    minFee: 1,
                    blockTime: 10,
                    levels: [
                        { label: 'high', feePerUnit: '5', blocks: 1 },
                        { label: 'normal', feePerUnit: '2', blocks: 6 },
                    ],
                },
            }),
    },
}));

const WEB_SOURCE: ConnectCallSource = {
    type: 'web',
    origin: 'https://app.example',
    manifest: { appName: 'app' },
};
const OUTPUTS = [{ address: 'recipient', amount: '1000' }];
const CALL_ID = '00000000-0000-4000-8000-000000000000';
const PICKER = {
    state: 'select-account',
    selectedAccountTypeKey: 'normal',
    manualAccountIndex: 0,
    candidates: [{ accountIndex: 0, accountTypeKey: 'normal', path: "m/84'/0'/0'" }],
};
const SIGNED = { success: true as const, payload: { signatures: [], serializedTx: 'tx' } };

const mockFinalTx = (fee: string): PrecomposeResultFinal => ({
    type: 'final',
    fee,
    feePerByte: fee,
    bytes: 1,
    totalSpent: '1000',
    inputs: [{ address_n: [], prev_hash: fee, prev_index: 0, amount: '5000' }],
    outputs: [],
    outputsPermutation: [],
});
const NOT_ENOUGH_FUNDS = { type: 'error', error: 'NOT-ENOUGH-FUNDS' } as const;

const mockComposeResults = (...results: (typeof NOT_ENOUGH_FUNDS | PrecomposeResultFinal)[][]) =>
    results.forEach(payload =>
        jest.mocked(TrezorConnect.composeTransaction).mockResolvedValueOnce({
            success: true,
            payload,
        }),
    );

// Stands in for the user: picks the account and answers the fee selections in turn.
const createDispatch = (...feeChoices: (SelectFeeChoice | undefined)[]) =>
    jest.fn(action => {
        if (connectPopupActions.selectAccount.match(action)) getPermissionDeferred().resolve();
        if (action.type === UI_REQUESTS.REQUEST_FEE) {
            getPermissionDeferred().resolve(feeChoices.shift());
        }

        return action;
    });

const createFlow = (dispatch: jest.Mock, source: ConnectCallSource = WEB_SOURCE, coin = 'btc') =>
    new SendTransaction(
        {
            method: 'sendTransaction',
            payload: { coin: asCoinSymbol(coin), outputs: OUTPUTS, push: true, callId: CALL_ID },
            source,
        },
        {
            dispatch,
            getState: () => ({
                device: { selectedDevice: mockSuiteDevice() },
                connectPopup: { activeCall: PICKER },
            }),
            signal: new AbortController().signal,
        },
    );

describe('SendTransaction', () => {
    beforeEach(() => {
        jest.mocked(TrezorConnect.composeTransaction).mockReset();
        jest.spyOn(SignTransaction.prototype, 'process').mockResolvedValue({
            response: SIGNED,
            isPostCallOngoing: false,
        });
    });

    it.each([
        [
            'a mobile deeplink',
            { ...WEB_SOURCE, type: CALL_SOURCE_DEEPLINK },
            'btc',
            'Method_NotAllowed',
        ],
        ['a coin Suite does not offer', WEB_SOURCE, 'grs', 'Method_UnsupportedCoinForHost'],
    ] as const)('rejects %s', (_, source, coin, code) => {
        const flow = createFlow(createDispatch(), source, coin);

        expect(() => flow['validate']()).toThrow(expect.objectContaining({ code }));
    });

    it('signs the transaction composed for the picked account with the selected fee', async () => {
        mockComposeResults([mockFinalTx('5'), mockFinalTx('2')]);
        const dispatch = createDispatch({ type: 'select-fee', value: 'high' });
        const flow = createFlow(dispatch);

        await expect(flow['callMethod']()).resolves.toEqual(SIGNED);

        expect(TrezorConnect.getPublicKey).toHaveBeenCalledWith(
            expect.objectContaining({ coin: 'btc', path: "m/84'/0'/0'" }),
        );
        expect(TrezorBlockchain.getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ coin: 'btc', descriptor: 'descriptor', details: 'tokens' }),
        );
        expect(TrezorBlockchain.getAccountInfo).not.toHaveBeenCalledWith(
            expect.objectContaining({ path: expect.anything() }),
        );
        expect(TrezorConnect.composeTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                coin: 'btc',
                outputs: OUTPUTS,
                path: "m/84'/0'/0'",
                utxo: [{ txid: 'txid', vout: 0, amount: '5000' }],
                changeAddress: expect.objectContaining({ address: 'unused' }),
                callId: CALL_ID,
            }),
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: UI_REQUESTS.REQUEST_FEE,
                payload: expect.objectContaining({
                    feeLevels: [expect.objectContaining({ label: 'high' }), expect.anything()],
                }),
            }),
        );
        expect(SignTransaction.prototype.process).toHaveBeenCalledWith(mockFinalTx('5'));
        expect(flow['signFlow']?.['payload']).toEqual({
            coin: 'btc',
            inputs: mockFinalTx('5').inputs,
            outputs: [],
            push: true,
            identity: undefined,
            callId: CALL_ID,
        });
    });

    it('composes the transaction again with a custom fee', async () => {
        mockComposeResults([mockFinalTx('5'), mockFinalTx('2')], [mockFinalTx('7')]);
        const flow = createFlow(createDispatch({ type: 'select-fee-custom', value: '7' }));

        await flow['callMethod']();

        expect(TrezorConnect.composeTransaction).toHaveBeenLastCalledWith(
            expect.objectContaining({ feeLevels: [{ feePerUnit: '7' }] }),
        );
        expect(SignTransaction.prototype.process).toHaveBeenCalledWith(mockFinalTx('7'));
    });

    it('offers the minimal fee when the account cannot afford any fee level', async () => {
        mockComposeResults(
            [NOT_ENOUGH_FUNDS, NOT_ENOUGH_FUNDS],
            [mockFinalTx('1')],
            [mockFinalTx('1')],
        );
        const dispatch = createDispatch({ type: 'select-fee-custom', value: '1' });

        await createFlow(dispatch)['callMethod']();

        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: UI_REQUESTS.REQUEST_FEE,
                payload: expect.objectContaining({
                    feeLevels: [{ label: 'custom', feePerUnit: '1', blocks: -1 }],
                }),
            }),
        );
        expect(SignTransaction.prototype.process).toHaveBeenCalledWith(mockFinalTx('1'));
    });

    it('returns to the picker as it was left when the account has not enough funds', async () => {
        mockComposeResults(
            [NOT_ENOUGH_FUNDS, NOT_ENOUGH_FUNDS],
            [NOT_ENOUGH_FUNDS],
            [mockFinalTx('5'), mockFinalTx('2')],
        );
        const dispatch = createDispatch({ type: 'select-fee', value: 'normal' });

        await createFlow(dispatch)['callMethod']();

        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({ type: 'not-enough-funds-error' }),
            }),
        );
        expect(dispatch).toHaveBeenCalledWith({
            type: connectPopupActions.selectAccount.type,
            payload: PICKER,
        });
        expect(SignTransaction.prototype.process).toHaveBeenCalledWith(mockFinalTx('2'));
    });

    it('continues with an account picked in the picker shown for a closed fee modal', async () => {
        mockComposeResults(
            [mockFinalTx('5'), mockFinalTx('2')],
            [mockFinalTx('5'), mockFinalTx('2')],
        );
        // No choice stands for an account picked after something else closed the fee modal.
        const dispatch = createDispatch(undefined, { type: 'select-fee', value: 'normal' });

        await createFlow(dispatch)['callMethod']();

        // The first pick and the picker's state restored for each fee modal, not another pick.
        expect(
            dispatch.mock.calls.filter(([action]) =>
                connectPopupActions.selectAccount.match(action),
            ),
        ).toHaveLength(3);
        expect(SignTransaction.prototype.process).toHaveBeenCalledWith(mockFinalTx('2'));
    });

    it('returns to the picker as it was left when the user changes the account', async () => {
        mockComposeResults(
            [mockFinalTx('5'), mockFinalTx('2')],
            [mockFinalTx('5'), mockFinalTx('2')],
        );
        const dispatch = createDispatch(
            { type: 'change-account' },
            { type: 'select-fee', value: 'normal' },
        );

        await createFlow(dispatch)['callMethod']();

        expect(dispatch).toHaveBeenCalledWith({
            type: connectPopupActions.selectAccount.type,
            payload: PICKER,
        });
        expect(SignTransaction.prototype.process).toHaveBeenCalledWith(mockFinalTx('2'));
    });
});
