import {
    selectDeviceButtonRequestsCodes,
    selectIsDeviceConnectedAndAuthorized,
} from '@suite-common/device';
import {
    selectAccountByKey,
    selectIsTransactionPending,
    useEvmNonceInfo,
} from '@suite-common/wallet-core';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type EvmNonceInfo } from '@suite-common/wallet-utils';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useCancelEvmTransaction } from './useCancelEvmTransaction';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useFocusEffect: jest.fn(),
}));

jest.mock('@suite-common/wallet-core', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountByKey: jest.fn(),
    selectIsTransactionPending: jest.fn(),
    useEvmNonceInfo: jest.fn(),
}));

jest.mock('@suite-common/device', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnectedAndAuthorized: jest.fn(),
    selectDeviceButtonRequestsCodes: jest.fn(),
}));

jest.mock('@suite-native/toasts', () => ({
    ...jest.requireActual('@suite-native/toasts'),
    useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('@suite-native/send', () => ({
    __esModule: true,
    signAndPushEvmCancelTransactionThunk: jest.fn(() => ({ type: 'mock/signAndPush' })),
}));

const ethAccount = mockWalletAccount({ symbol: 'eth' });
const btcAccount = mockWalletAccount({ symbol: 'btc' });

const ethRbfParams = {
    type: 'ethereum',
    txid: '0xpendingtxid',
    outputs: [],
    ethereumNonce: 5,
    transactionData: '',
    gasPrice: '',
    maxFeePerGas: '20',
    maxPriorityFeePerGas: '2',
};

// A pending outgoing ETH tx (nonce 5), signed by the account itself, carrying ethereum rbf
// params — the cancellable base case.
const pendingEvmTx = {
    type: 'sent',
    txid: '0xpendingtxid',
    blockHeight: 0,
    ethereumSpecific: { nonce: 5 },
    rbfParams: ethRbfParams,
    details: { vin: [{ isAccountOwned: true }] },
} as unknown as WalletAccountTransaction;

// nonce 5 sits inside [confirmedNonce, nextNonce] with no confirmed tx in its slot -> 'ok'.
const liveNonceInfo: EvmNonceInfo = {
    confirmedNonce: 5,
    nextNonce: 6,
    pendingNonces: [5],
    confirmedNonces: [],
};
// nonce 5 is below confirmedNonce 6 and a locally-known confirmed tx occupies that slot
// (confirmedNonces) -> 'superseded' -> stuck.
const stuckNonceInfo: EvmNonceInfo = {
    confirmedNonce: 6,
    nextNonce: 6,
    pendingNonces: [],
    confirmedNonces: [5],
};

const selectAccountByKeyMock = selectAccountByKey as unknown as jest.Mock;
const selectIsTransactionPendingMock = selectIsTransactionPending as unknown as jest.Mock;
const useEvmNonceInfoMock = useEvmNonceInfo as unknown as jest.Mock;
const selectIsDeviceConnectedAndAuthorizedMock =
    selectIsDeviceConnectedAndAuthorized as unknown as jest.Mock;
const selectDeviceButtonRequestsCodesMock = selectDeviceButtonRequestsCodes as unknown as jest.Mock;

// Stable references so react-redux's reference-equality useSelector doesn't re-render every tick.
const EMPTY_BUTTON_REQUEST_CODES: number[] = [];

const renderCancelHook = async (transaction: WalletAccountTransaction = pendingEvmTx) =>
    await renderHookWithStoreProvider(() =>
        useCancelEvmTransaction({ accountKey: ethAccount.key, transaction }),
    );

describe('useCancelEvmTransaction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        selectAccountByKeyMock.mockReturnValue(ethAccount);
        selectIsTransactionPendingMock.mockReturnValue(true);
        useEvmNonceInfoMock.mockReturnValue({ nonceInfo: liveNonceInfo });
        selectIsDeviceConnectedAndAuthorizedMock.mockReturnValue(true);
        selectDeviceButtonRequestsCodesMock.mockReturnValue(EMPTY_BUTTON_REQUEST_CODES);
    });

    it('is cancellable for a pending EVM tx with rbf params and a live (non-stuck) nonce', async () => {
        const { result } = await renderCancelHook();

        expect(result.current.isCancellable).toBe(true);
        // sanity: nothing composed/signing yet
        expect(result.current.composedCancelTx).toBeNull();
        expect(result.current.isComposing).toBe(false);
        expect(result.current.composeError).toBe(false);
        expect(result.current.isSigning).toBe(false);
    });

    it('is not cancellable when the account is not an EVM account', async () => {
        selectAccountByKeyMock.mockReturnValue(btcAccount);

        const { result } = await renderCancelHook();

        expect(result.current.isCancellable).toBe(false);
    });

    it('is not cancellable when the transaction is no longer pending', async () => {
        selectIsTransactionPendingMock.mockReturnValue(false);

        const { result } = await renderCancelHook();

        expect(result.current.isCancellable).toBe(false);
    });

    it("is not cancellable when the tx's own nonce is stuck (superseded/gapped)", async () => {
        useEvmNonceInfoMock.mockReturnValue({ nonceInfo: stuckNonceInfo });

        const { result } = await renderCancelHook();

        expect(result.current.isCancellable).toBe(false);
    });

    it('is not cancellable for a tx without ethereum rbf params', async () => {
        const txWithoutRbf = { ...pendingEvmTx, rbfParams: undefined } as WalletAccountTransaction;

        const { result } = await renderCancelHook(txWithoutRbf);

        expect(result.current.isCancellable).toBe(false);
    });
});
