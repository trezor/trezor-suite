import { Keyboard } from 'react-native';

import { combineReducers } from '@reduxjs/toolkit';

import { toTokenAddress } from '@suite-common/tokens';
import {
    type YieldRootState,
    getYieldSessionKey,
    initialStablecoinYieldState,
    yieldActions,
    yieldReducer,
} from '@suite-common/wallet-core';
import { mockResolvedYieldFlowData, mockYieldSessionState } from '@suite-common/wallet-core/mocks';
import { YieldStackRoutes } from '@suite-native/navigation';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';
import { createDeferred } from '@trezor/utils';

import { useYieldDepositApprovalSubmit } from './useYieldDepositApprovalSubmit';

type ApprovalResult = {
    type: string;
    meta: { requestStatus: 'fulfilled' | 'rejected'; requestId: string };
};

const mockInitAllowance = mock<() => Promise<ApprovalResult>>();
const mockSubmitApproval = mock<() => Promise<ApprovalResult>>();
const mockPrepareReview = mock<() => Promise<ApprovalResult>>();
const mockNavigate = jest.fn();
const mockShowAlert = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    initYieldAllowanceThunk: () => mockInitAllowance,
    submitYieldApproveThunk: () => mockSubmitApproval,
}));
jest.mock('../../thunks/yield/yieldApprovalThunks', () => ({
    ...jest.requireActual('../../thunks/yield/yieldApprovalThunks'),
    prepareYieldAllowanceReviewTransactionThunk: () => mockPrepareReview,
}));
jest.mock('./useShowYieldAlert', () => ({ useShowYieldAlert: () => mockShowAlert }));

const fulfilled: ApprovalResult = {
    type: 'approval/fulfilled',
    meta: { requestStatus: 'fulfilled', requestId: 'approval' },
};
const flow = mockResolvedYieldFlowData({ isWrappedNativeVault: false });
const tokenContract = toTokenAddress('0x0000000000000000000000000000000000000001');
const routeParams = { accountKey: flow.account.key, tokenContract };

const renderApprovalSubmit = async (
    session = mockYieldSessionState({
        approval: {
            allowanceAmount: '0',
            allowanceStatus: 'loaded',
            modalState: {
                amount: '5',
                contractAddress: tokenContract,
                spender: '0x0000000000000000000000000000000000000003',
                txType: 'approve',
            },
        },
    }),
) => {
    const preloadedState: YieldRootState = {
        wallet: {
            stablecoinYield: {
                ...initialStablecoinYieldState,
                deposit: { [getYieldSessionKey(flow.flowKey)]: session },
            },
        },
    };
    const store = createLightStore({
        reducer: {
            wallet: combineReducers({
                stablecoinYield: yieldReducer,
                settings: createStaticReducer({ localCurrency: 'usd', bitcoinAmountUnit: 0 }),
            }),
            locale: createStaticReducer({
                appLocaleCode: 'en-US',
                systemLocaleCode: 'en-US',
                isSystemLocaleUsed: true,
            }),
        },
        preloadedState,
    });
    const view = await renderHookWithStoreProvider(
        () =>
            useYieldDepositApprovalSubmit({
                approvalLimitType: 'minimal',
                flowData: flow.flowData,
                flowKey: flow.flowKey,
                routeParams,
            }),
        { services: { store } },
    );

    return { ...view, store };
};

describe('useYieldDepositApprovalSubmit', () => {
    let isKeyboardVisible: boolean;

    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockReset();
        mockInitAllowance.mockReset();
        mockSubmitApproval.mockReset();
        mockPrepareReview.mockReset();
        mockInitAllowance.mockResolvedValue(fulfilled);
        mockSubmitApproval.mockResolvedValue(fulfilled);
        mockPrepareReview.mockResolvedValue(fulfilled);
        isKeyboardVisible = false;
        jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {
            isKeyboardVisible = false;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each(['approval', 'review'] as const)(
        'closes a keyboard reopened while waiting for %s preparation before review',
        async stage => {
            const pending = createDeferred<ApprovalResult>();
            (stage === 'approval' ? mockSubmitApproval : mockPrepareReview).mockReturnValueOnce(
                pending.promise,
            );
            const { result } = await renderApprovalSubmit();
            let submission: Promise<void>;

            await act(() => {
                submission = result.current.handleSubmitApproval('5');
            });
            expect(result.current.isCheckingApproval).toBe(true);
            expect(mockNavigate).not.toHaveBeenCalled();

            isKeyboardVisible = true;
            mockNavigate.mockImplementationOnce(() => {
                expect(isKeyboardVisible).toBe(false);
            });
            await act(async () => {
                pending.resolve(fulfilled);
                await submission;
            });

            expect(mockNavigate).toHaveBeenCalledWith(YieldStackRoutes.YieldDepositApprovalReview, {
                ...routeParams,
                amount: '5',
                approvalLimitType: 'minimal',
            });
            expect(result.current.isCheckingApproval).toBe(false);
        },
    );

    it.each(['continue', 'revoke'] as const)(
        'closes a keyboard reopened while loading allowance before %s navigation',
        async action => {
            const pending = createDeferred<ApprovalResult>();
            mockInitAllowance.mockReturnValueOnce(pending.promise);
            const { result, store } = await renderApprovalSubmit(
                mockYieldSessionState({
                    approval: {
                        allowanceStatus: 'loading',
                        isRevokeRequired: action === 'revoke',
                    },
                }),
            );
            let submission: Promise<void>;
            await act(() => {
                submission = result.current.handleSubmitApproval('5');
            });
            expect(result.current.isCheckingApproval).toBe(true);
            isKeyboardVisible = true;
            mockNavigate.mockImplementationOnce(() => {
                expect(isKeyboardVisible).toBe(false);
            });

            await act(async () => {
                store.dispatch(
                    yieldActions.setInitializedAllowance({
                        flowType: 'deposit',
                        flowKey: flow.flowKey,
                        amount: '10',
                    }),
                );
                pending.resolve(fulfilled);
                await submission;
            });

            expect(mockNavigate).toHaveBeenCalledWith(
                action === 'revoke'
                    ? YieldStackRoutes.YieldDepositRevoke
                    : YieldStackRoutes.YieldDeposit,
                expect.objectContaining(routeParams),
            );
        },
    );

    it('closes a keyboard reopened while approval discovers sufficient allowance', async () => {
        const pending = createDeferred<ApprovalResult>();
        const { result, store } = await renderApprovalSubmit();
        mockSubmitApproval.mockImplementationOnce(async () => {
            await pending.promise;
            store.dispatch(
                yieldActions.completeApproval({
                    flowType: 'deposit',
                    flowKey: flow.flowKey,
                    amount: '5',
                }),
            );

            return fulfilled;
        });
        let submission: Promise<void>;
        await act(() => {
            submission = result.current.handleSubmitApproval('5');
        });
        expect(result.current.isCheckingApproval).toBe(true);
        isKeyboardVisible = true;
        mockNavigate.mockImplementationOnce(() => {
            expect(isKeyboardVisible).toBe(false);
        });

        await act(async () => {
            pending.resolve(fulfilled);
            await submission;
        });

        expect(mockNavigate).toHaveBeenCalledWith(YieldStackRoutes.YieldDeposit, routeParams);
    });

    it('does not navigate when review preparation fails', async () => {
        mockPrepareReview.mockResolvedValueOnce({
            type: 'approval/rejected',
            meta: { requestStatus: 'rejected', requestId: 'approval' },
        });
        const { result } = await renderApprovalSubmit();
        isKeyboardVisible = true;

        await act(() => result.current.handleSubmitApproval('5'));

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockShowAlert).toHaveBeenCalled();
        expect(isKeyboardVisible).toBe(true);
    });
});
