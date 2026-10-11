import { getNetwork } from '@suite-common/wallet-config';
import { sendFormActions } from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockAccountToken } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import { ethereumSignTransaction } from './ethereumSignTransaction';

const TOKEN_CONTRACT = '0x128cC466B61f542da60c70e3aA11c10e19B84EDB';
const RECIPIENT = '0x000000000000000000000000000000000000abcd';
const TRANSFER_DATA = `0xa9059cbb${RECIPIENT.slice(2).padStart(64, '0')}${(1_500_000)
    .toString(16)
    .padStart(64, '0')}`;

const accountToken = mockAccountToken({ contract: TOKEN_CONTRACT.toLowerCase(), decimals: 6 });

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: { ethereumGetAddress: jest.fn() },
}));

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: () => ({ path: '1', instance: 0, useEmptyPassphrase: true }),
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountForNetworkSymbolAndPath: () => ({ key: 'account-key', tokens: [accountToken] }),
}));

const mockedGetAddress = TrezorConnect.ethereumGetAddress as jest.Mock;

const runPreCallHook = (chainId: number) => {
    const dispatch = jest.fn(action => {
        // Stands in for the user confirming the simulation modal. Deferred to the next tick
        // because the hook creates the permission deferred right after this dispatch.
        if (connectPopupActions.txSimulation.match(action)) {
            setTimeout(() => getPermissionDeferred().resolve());
        }

        return action;
    });

    const run = ethereumSignTransaction.preCallHook({
        method: 'ethereumSignTransaction',
        payload: {
            path: "m/44'/60'/0'/0/0",
            transaction: { to: '0x0', value: '0x0', gasLimit: '0x5208', nonce: '0x0', chainId },
        },
        dispatch,
        getState: () => ({}),
        source: { type: 'walletconnect', manifest: { appName: 'dapp' } },
    } as any);

    return { run, dispatch };
};

// The shape connect returns for a transfer of a token without a firmware definition.
const contractCallPrecomposedTx: PrecomposedTransactionFinal = {
    type: 'final',
    inputs: [],
    outputsPermutation: [0],
    outputs: [{ address: TOKEN_CONTRACT, amount: '0', script_type: 'PAYTOADDRESS' }],
    totalSpent: '42000',
    fee: '42000',
    feePerByte: '20',
    bytes: 0,
    max: undefined,
    isTokenKnown: false,
};

const runTokenTransferPreCallHook = async () => {
    const dispatch = jest.fn(action => action);

    await ethereumSignTransaction.preCallHook({
        method: 'ethereumSignTransaction',
        payload: {
            path: "m/44'/60'/0'/0/0",
            transaction: {
                to: TOKEN_CONTRACT,
                value: '0x0',
                data: TRANSFER_DATA,
                gasLimit: '0xa410',
                nonce: '0x5',
                chainId: getNetwork('arc').chainId,
            },
        },
        dispatch,
        getState: () => ({}),
        txSigningPrecomposed: contractCallPrecomposedTx,
        source: { type: 'desktop-ws' },
    } as any);

    return dispatch.mock.calls
        .map(([action]) => action)
        .find(sendFormActions.storePrecomposedTransaction.match);
};

describe('ethereumSignTransaction.preCallHook', () => {
    beforeEach(() => {
        mockedGetAddress.mockResolvedValue({ success: true, payload: { address: '0xabc' } });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('opens the simulation modal for a chain Blockaid can scan', async () => {
        const { run, dispatch } = runPreCallHook(getNetwork('eth').chainId);
        await run;

        expect(dispatch).toHaveBeenCalledWith(
            connectPopupActions.txSimulation({ fromAddress: '0xabc' }),
        );
    });

    it.each([
        ['Arc', getNetwork('arc').chainId],
        ['Arc Testnet', getNetwork('tarc').chainId],
        ['Ethereum Classic', getNetwork('etc').chainId],
    ])('skips the simulation modal on %s, which Blockaid cannot scan', async (_name, chainId) => {
        const { run, dispatch } = runPreCallHook(chainId);
        await run;

        expect(mockedGetAddress).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: connectPopupActions.txSimulation.type }),
        );
    });

    it('stores a token transfer connect could not decode with the account token', async () => {
        const storeAction = await runTokenTransferPreCallHook();

        expect(storeAction?.payload.precomposedTransaction).toMatchObject({
            outputs: [{ address: RECIPIENT, amount: '1500000' }],
            token: accountToken,
            isTokenKnown: false,
        });
        expect(storeAction?.payload.formState).toMatchObject({
            transactionData: TRANSFER_DATA.slice(2),
            ethereumNonce: '5',
        });
    });
});
