import { type ComponentProps, type PropsWithChildren } from 'react';
import { Text } from 'react-native';

import { type UnknownAction, combineReducers } from '@reduxjs/toolkit';

import { selectSelectedDevice } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    feesActions,
    feesReducer,
    formDraftReducer,
    yieldActions,
    yieldReducer,
} from '@suite-common/wallet-core';
import { mockResolvedYieldFlowData } from '@suite-common/wallet-core/mocks';
import { type FeeInfo, type FeesState } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { prepareSendFormReducer } from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';
import { createDeferred } from '@trezor/utils';

import { YieldWithdrawReviewScreen } from './YieldWithdrawReviewScreen';
import { type YieldWithdrawReviewContent } from '../../components/yield/YieldWithdrawReviewContent';
import { type useEarnTransactionReview } from '../../hooks/earn/useEarnTransactionReview';
import { useYieldWithdrawFees } from '../../hooks/yield/useYieldWithdrawFees';
import { useYieldWithdrawReview } from '../../hooks/yield/useYieldWithdrawReview';

const mockData = mockResolvedYieldFlowData({
    account: mockWalletAccount({
        symbol: asNetworkSymbol('eth'),
        availableBalance: '1000000000000000000',
    }),
});
const mockNavigation = { navigate: jest.fn(), replace: jest.fn(), goBack: jest.fn() };
let mockFlowType: 'withdraw' | 'redeem' = 'withdraw';
let mockSignAction: Parameters<typeof useEarnTransactionReview>[0]['signAction'];
const unsignedTransaction = JSON.stringify({
    from: '0x1111111111111111111111111111111111111111',
    to: '0x0000000000000000000000000000000000000001',
    data: `0xb460af94${'1'.padStart(64, '0')}${'1111111111111111111111111111111111111111'.padStart(64, '0').repeat(2)}`,
    chainId: 1,
    gasLimit: '0x30d40',
    nonce: '0x1',
    value: '0x0',
    gasPrice: '0x3b9aca00',
});
const feeInfo: FeeInfo = {
    blockHeight: 100,
    blockTime: 12,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [{ label: 'normal', feePerUnit: '10000000000', blocks: 1 }],
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useRoute: () => ({ params: { withdrawFlowType: mockFlowType } }),
}));
jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: jest.fn(),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    updateFeeInfoThunk: () => () => Promise.resolve(),
    composeYieldWithdrawTransactionThunk: () => () => ({
        unwrap: () => Promise.resolve({ type: 'action-ready', unsignedTransaction }),
    }),
}));
jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: { ethereumSignTransaction: jest.fn() },
}));
jest.mock('@suite-native/earn', () => ({
    ...jest.requireActual('@suite-native/earn'),
    useYieldFlowData: () => mockData,
}));
jest.mock('../../components/earn/EarnDeviceConnectionGuard', () => ({
    EarnDeviceConnectionGuard: ({ children }: PropsWithChildren) => children,
}));
jest.mock('../../hooks/earn/useEarnTransactionReview', () => ({
    useEarnTransactionReview: ({ signAction }: Parameters<typeof useEarnTransactionReview>[0]) => {
        mockSignAction = signAction;

        return {};
    },
}));
jest.mock('../../components/yield/YieldWithdrawReviewContent', () => ({
    YieldWithdrawReviewContent: (props: ComponentProps<typeof YieldWithdrawReviewContent>) => {
        useYieldWithdrawReview(props);

        return <Text testID="review-fee">{props.preview.summary.fee}</Text>;
    },
}));

describe.each(['withdraw', 'redeem'] as const)('%s Review fee snapshot', flowType => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        mockFlowType = flowType;
        jest.mocked(selectSelectedDevice).mockReturnValue(
            mockSuiteDevice({}, { major_version: 2, minor_version: 13, patch_version: 0 }),
        );
    });
    afterEach(() => jest.useRealTimers());

    it('keeps the displayed and device fee at Continue while background rates refresh', async () => {
        const store = createLightStore({
            reducer: {
                discreetMode: createStaticReducer({ isActive: false }),
                locale: createStaticReducer({ systemLocaleCode: 'en', appLocaleCode: 'system' }),
                wallet: combineReducers({
                    settings: createStaticReducer({ localCurrency: 'usd', bitcoinAmountUnit: 0 }),
                    stablecoinYield: yieldReducer,
                    fees: (
                        state: FeesState = { eth: { status: 'loaded', data: feeInfo } },
                        action: UnknownAction,
                    ) => feesReducer(state, action),
                    formDrafts: formDraftReducer,
                    send: prepareSendFormReducer({
                        actionTypes: { storageLoad: mockActionType('storageLoad') },
                        reducers: { storageLoadFormDrafts: mockReducer() },
                    }),
                }),
            },
        });
        const services = { store, analytics: mockNativeAnalytics() };
        // The form remains mounted below Review in the native navigation stack.
        const { result } = await renderHookWithStoreProvider(useYieldWithdrawFees, {
            initialProps: { ...mockData, amount: '1', flowType, isEnabled: true },
            services,
        });
        await act(() => jest.advanceTimersByTimeAsync(300));
        const prepared = result.current.preparedAction!;
        expect(prepared).not.toBeNull();
        store.dispatch(yieldActions.initSession({ flowType, flowKey: mockData.flowKey }));
        store.dispatch(
            yieldActions.storeActionReviewData({
                ...prepared,
                receiptAmount: '0.4',
                flowType,
                flowKey: mockData.flowKey,
            }),
        );
        const view = await renderWithStoreProvider(<YieldWithdrawReviewScreen />, { services });
        expect(view.getByTestId('review-fee')).toHaveTextContent('2000000000000000');

        const signing =
            createDeferred<Awaited<ReturnType<typeof TrezorConnect.ethereumSignTransaction>>>();
        jest.mocked(TrezorConnect.ethereumSignTransaction).mockReturnValueOnce(signing.promise);
        let pendingSign: ReturnType<typeof mockSignAction>;
        await act(() => {
            pendingSign = mockSignAction();
        });
        expect(TrezorConnect.ethereumSignTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                transaction: expect.objectContaining({ gasPrice: '0x2540be400' }),
            }),
        );

        await act(() => {
            store.dispatch(
                feesActions.updateMultipleFees({
                    eth: {
                        status: 'loaded',
                        data: {
                            ...feeInfo,
                            levels: [{ label: 'normal', blocks: 1, feePerUnit: '20000000000' }],
                        },
                    },
                }),
            );
        });
        expect(result.current.formDraft?.feePerUnit).toBe('20');
        expect(view.getByTestId('review-fee')).toHaveTextContent('2000000000000000');
        expect(TrezorConnect.ethereumSignTransaction).toHaveBeenCalledTimes(1);
        await act(async () => {
            signing.resolve({ success: true, payload: { serializedTx: '0xsigned' } } as Awaited<
                ReturnType<typeof TrezorConnect.ethereumSignTransaction>
            >);
            await pendingSign;
        });
        expect(store.getState().wallet.stablecoinYield.txReview.precomposedTx?.fee).toBe(
            '2000000000000000',
        );
        expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
});
