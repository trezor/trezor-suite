import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowResolvedData } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import TrezorConnect from '@trezor/connect';
import { type WithServices } from '@trezor/redux-utils';

import { signWrappedNativeTokenThunk } from './wrappedNativeTokenThunks';
import { signYieldClaimReviewThunk } from '../yield/yieldClaimThunks';
import {
    type SignYieldActionReviewThunkState,
    signYieldActionReviewThunk,
} from '../yield/yieldTransactionThunks';

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: () => mockSuiteDevice(),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAddressDisplayType: () => 'original',
    isYieldSupported: () => true,
    isWrappedNativeFlowSupported: () => true,
    selectYieldSession: (_state: unknown, type: string) => ({
        action: {
            review: {
                type,
                amount: '1',
                rewards: [],
                unsignedTransaction: { gasLimit: '21000', gasPrice: '1' },
            },
        },
    }),
}));
jest.mock('@suite-common/earn-stablecoin', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin'),
    buildStablecoinYieldTransactionReview: () => ({
        formState: {},
        precomposedTransaction: {},
        transactionForSigning: {},
    }),
    buildClaimTransactionReview: () => ({
        formState: {},
        precomposedTransaction: {},
        transactionForSigning: {},
        availableRewards: [],
    }),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const token = { networkSymbol: account.symbol, symbol: 'eth', decimals: 18, contractAddress: null };
const flowData = { account, token } as unknown as YieldFlowResolvedData;
const analytics = mockNativeAnalytics();

type SigningStore = TestCompositionStore<
    SignYieldActionReviewThunkState,
    WithServices<NativeAnalyticsDep>
>;

const signers = [
    [
        'yield',
        (store: SigningStore) =>
            store.dispatch(
                signYieldActionReviewThunk({ flowData, flowKey: 'flow', flowType: 'deposit' }),
            ),
    ],
    [
        'claim',
        (store: SigningStore) =>
            store.dispatch(signYieldClaimReviewThunk({ account, flowKey: 'flow' })),
    ],
    [
        'wrap/unwrap',
        (store: SigningStore) =>
            store.dispatch(
                signWrappedNativeTokenThunk({
                    account,
                    token,
                    amount: '1',
                    unsignedTransaction: '{}',
                }),
            ),
    ],
] as const;

beforeEach(() => jest.clearAllMocks());

it.each(signers)('reports only intentional signing cancellations for %s', async (_, sign) => {
    for (const { code, message, expected } of [
        { code: 'Failure_ActionCancelled', message: 'cancelled', expected: true },
        { code: 'Failure_PinCancelled', message: 'cancelled', expected: true },
        { code: 'Method_Cancel', message: 'tx-cancelled', expected: true },
        { code: 'Method_Cancel', message: 'tx-timeout', expected: false },
        { code: 'Device_Disconnected', message: 'disconnected', expected: false },
    ] as const) {
        jest.clearAllMocks();
        jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
            success: false,
            error: { code, message },
        });
        const { store } = createTestCompositionRoot<
            WithServices<NativeAnalyticsDep>,
            SignYieldActionReviewThunkState
        >({
            services: () => ({ analytics }),
        }).services;

        const result = await sign(store);

        expect(TrezorConnect.ethereumSignTransaction).toHaveBeenCalledTimes(1);
        expect(result.payload).toEqual({
            error: 'sign-transaction-failed',
            errorCode: code,
            message,
        });
        expect(analytics.report).toHaveBeenCalledTimes(expected ? 1 : 0);
        if (expected) {
            expect(analytics.report).toHaveBeenCalledWith({
                type: 'transaction/cancel',
                payload: { txType: 'yield', networkSymbol: 'eth', stage: 'signing' },
            });
        }
    }
});
