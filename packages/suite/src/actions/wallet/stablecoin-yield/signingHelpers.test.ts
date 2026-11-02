import { USER_CANCELLED_ERROR_CODES } from '@suite-common/earn-stablecoin';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type EvmSelectedFee, type FeeLevelLabel } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import {
    type SendYieldTransactionParams,
    type SendYieldTransactionState,
    sendYieldTransaction,
} from './signingHelpers';

const mockBuildStablecoinYieldTransactionReview = jest.fn();
const mockDevice = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: 'wallet@device:0' },
});
const OPEN_DEFERRED_MODAL_ACTION_TYPE = 'mock/openDeferredModal';

jest.mock('@suite/modal', () => ({
    preserveModal: () => ({ type: 'mock/preserveModal' }),
    closeModal: () => ({ type: 'mock/closeModal' }),
    openDeferredModal: (payload: unknown) => ({
        type: 'mock/openDeferredModal',
        payload,
    }),
}));

jest.mock('@suite-common/earn-stablecoin', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin'),
    buildStablecoinYieldTransactionReview: (payload: unknown) =>
        mockBuildStablecoinYieldTransactionReview(payload),
}));

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: () => mockDevice,
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAddressDisplayType: () => 'original',
    selectIsMevProtectionEnabled: () => false,
}));

jest.mock('@suite-common/mev', () => ({
    selectIsMevProtectionFeatureEnabled: () => false,
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') }) as Account;

// Only openDeferredModal needs a real return value; every other dispatched action is recorded
// and ignored (thunks are intentionally not executed).
const createDispatch = (isReviewModalConfirmed: boolean) =>
    jest.fn((action: { type?: string }) => {
        if (action?.type === OPEN_DEFERRED_MODAL_ACTION_TYPE) {
            return Promise.resolve(isReviewModalConfirmed);
        }

        return action;
    }) as unknown as SendYieldTransactionParams['dispatch'];

type SendTransactionParams = {
    isReviewModalConfirmed?: boolean;
    selectedFee?: EvmSelectedFee | null;
    selectedFeeLevel?: FeeLevelLabel;
    unsignedTransaction?: string;
    dispatch?: ReturnType<typeof createDispatch>;
};

const sendTransaction = ({
    isReviewModalConfirmed = true,
    selectedFee = null,
    selectedFeeLevel = 'normal',
    unsignedTransaction = '{}',
    dispatch = createDispatch(isReviewModalConfirmed),
}: SendTransactionParams = {}) =>
    sendYieldTransaction({
        account,
        amount: '100',
        token: {
            networkSymbol: asNetworkSymbol('eth'),
            symbol: 'usdc',
            decimals: 6,
            contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        },
        unsignedTransaction,
        flowKey: 'flow-1',
        flowType: 'deposit',
        dispatch,
        getState: () => ({}) as unknown as SendYieldTransactionState,
        selectedFee,
        selectedFeeLevel,
    });

describe('sendYieldTransaction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockBuildStablecoinYieldTransactionReview.mockReturnValue({
            transactionForSigning: {
                to: '0xd63070114470f685b75B74D60EEc7c1113d33a3D',
                value: '0x0',
                data: '0x',
                chainId: 1,
                nonce: '0x1',
                gasLimit: '0x5208',
                gasPrice: '0x1',
            },
            formState: {},
            precomposedTransaction: { fee: '31500000000' },
        });
        jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
            success: true,
            payload: { v: '0x1', r: '0x2', s: '0x3', serializedTx: '0xsigned' },
        });
        jest.spyOn(TrezorConnect, 'pushTransaction').mockResolvedValue({
            success: true,
            payload: { txid: '0xtxid' },
        });
    });

    it.each(['low', 'normal', 'high', 'custom'] as const)(
        'carries the selected %s fee from simulation into the transaction review',
        async selectedFeeLevel => {
            mockBuildStablecoinYieldTransactionReview.mockImplementationOnce(
                jest.requireActual('@suite-common/earn-stablecoin')
                    .buildStablecoinYieldTransactionReview,
            );
            const dispatch = createDispatch(false);

            await sendTransaction({
                dispatch,
                selectedFeeLevel,
                selectedFee: {
                    type: 'legacy',
                    gasLimit: '0x5208',
                    gasPrice: '0x1',
                },
                unsignedTransaction: JSON.stringify({
                    from: '0x1111111111111111111111111111111111111111',
                    to: '0x2222222222222222222222222222222222222222',
                    data: '0x',
                    chainId: 1,
                    gasLimit: '0x5208',
                    nonce: '0x1',
                    gasPrice: '0x1',
                }),
            });

            expect(dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        precomposedForm: expect.objectContaining({ selectedFee: selectedFeeLevel }),
                    }),
                }),
            );
            expect(TrezorConnect.pushTransaction).not.toHaveBeenCalled();
        },
    );

    it.each([...USER_CANCELLED_ERROR_CODES])(
        'returns cancelled when signing fails with %s',
        async code => {
            jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
                success: false,
                error: { code, message: 'cancelled by user' },
            });

            await expect(sendTransaction()).resolves.toEqual({
                status: 'cancelled',
                stage: 'signing',
            });
        },
    );

    it('returns cancelled when the review modal is declined before broadcast', async () => {
        await expect(sendTransaction({ isReviewModalConfirmed: false })).resolves.toEqual({
            status: 'cancelled',
            stage: 'review',
        });
        expect(TrezorConnect.pushTransaction).not.toHaveBeenCalled();
    });

    it('throws with the connect code as cause for other signing failures', async () => {
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
            success: false,
            error: { code: 'Failure_FirmwareError', message: 'firmware error' },
        });

        await expect(sendTransaction()).rejects.toMatchObject({
            cause: 'Failure_FirmwareError',
        });
    });

    it('returns sent with the txid and the precomposed fee after broadcast', async () => {
        await expect(sendTransaction()).resolves.toEqual({
            status: 'sent',
            txid: '0xtxid',
            fee: '31500000000',
        });
    });
});
