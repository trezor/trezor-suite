import { combineReducers } from '@reduxjs/toolkit';

import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import {
    type StablecoinYieldRootState,
    type YieldFlowResolvedData,
    fetchAllowance,
    selectStablecoinYieldSession,
    stablecoinYieldActions,
    stablecoinYieldReducer,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { asAmountSubunit } from '@suite-common/wallet-utils';
import { type YieldFlowParams, YieldStackRoutes } from '@suite-native/navigation';
import {
    type TestStore,
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { BigNumber } from '@trezor/utils';

import { useStartYieldDepositFlow } from '../useStartYieldDepositFlow';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

jest.mock('@suite-common/wallet-core/src/allowance/fetchAllowance');

const fetchAllowanceMock = jest.mocked(fetchAllowance);

const accountKey = 'eth-account-key' as AccountKey;
const ownerAddress = '0x0000000000000000000000000000000000000001';
const tokenContract = '0x0000000000000000000000000000000000000002' as TokenAddress;
const receiptTokenContract = '0x0000000000000000000000000000000000000003';
const yieldId = 'dummy-yield-id';
const flowKey = `${accountKey}:${yieldId}:${tokenContract}`;
const routeParams = {
    accountKey,
    tokenContract,
    yieldId,
} satisfies YieldFlowParams;
const sessionParams = {
    flowKey,
    flowType: 'deposit' as const,
};

const account = {
    key: accountKey,
    symbol: 'eth',
    descriptor: ownerAddress,
} as unknown as Account;

const vault = {
    id: yieldId,
    outputToken: {
        address: receiptTokenContract,
        symbol: 'trSHUSDCp',
        name: 'Trezor Steakhouse USDC Prime',
        decimals: 18,
        network: 'ethereum',
    },
} as YieldDtoV2;

const flowData = {
    account,
    vault,
    token: {
        balance: '25',
        contractAddress: tokenContract,
        decimals: 6,
        networkSymbol: 'eth',
        symbol: 'USDC',
    },
    receiptToken: {
        contractAddress: receiptTokenContract,
        decimals: 18,
        networkSymbol: 'eth',
        symbol: 'trSHUSDCp',
    },
} satisfies YieldFlowResolvedData;

const allowanceSubunits = (value: string) => asAmountSubunit(new BigNumber(value));

const buildStore = () =>
    createLightStore({
        reducer: {
            locale: createStaticReducer({
                appLocaleCode: 'en-US',
                systemLocaleCode: 'en-US',
                isSystemLocaleUsed: true,
            }),
            wallet: combineReducers({
                settings: createStaticReducer({
                    localCurrency: 'usd',
                    bitcoinAmountUnit: 0,
                }),
                stablecoinYield: stablecoinYieldReducer,
            }),
        },
    });

const renderUseStartYieldDepositFlow = (store: TestStore) =>
    renderHookWithStoreProvider(
        () =>
            useStartYieldDepositFlow({
                flowData,
                flowKey,
                routeParams,
            }),
        { store },
    );

describe('useStartYieldDepositFlow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fetchAllowanceMock.mockResolvedValue(allowanceSubunits('0'));
    });

    it('navigates to deposit when allowance initialization skips to action step', async () => {
        const store = buildStore();
        fetchAllowanceMock.mockResolvedValue(allowanceSubunits('1000000'));
        const { result } = renderUseStartYieldDepositFlow(store);

        await act(async () => {
            await result.current.handleStartYieldDepositFlow();
        });

        expect(mockNavigate).toHaveBeenCalledWith(YieldStackRoutes.YieldDeposit, routeParams);
    });

    it('navigates to approval when allowance is zero', async () => {
        const store = buildStore();
        const { result } = renderUseStartYieldDepositFlow(store);

        await act(async () => {
            await result.current.handleStartYieldDepositFlow();
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            YieldStackRoutes.YieldDepositApproval,
            routeParams,
        );
    });

    it('resets stale action session before routing from zero allowance', async () => {
        const store = buildStore();
        store.dispatch(stablecoinYieldActions.resetSession(sessionParams));
        store.dispatch(stablecoinYieldActions.skipApprovalStep(sessionParams));
        const { result } = renderUseStartYieldDepositFlow(store);

        await act(async () => {
            await result.current.handleStartYieldDepositFlow();
        });

        const session = selectStablecoinYieldSession(
            store.getState() as StablecoinYieldRootState,
            'deposit',
            flowKey,
        );

        expect(session.step).toBe('approve');
        expect(mockNavigate).toHaveBeenCalledWith(
            YieldStackRoutes.YieldDepositApproval,
            routeParams,
        );
    });

    it('falls back to approval when allowance initialization fails', async () => {
        const store = buildStore();
        fetchAllowanceMock.mockRejectedValue(new Error('Allowance unavailable.'));
        const { result } = renderUseStartYieldDepositFlow(store);

        await act(async () => {
            await result.current.handleStartYieldDepositFlow();
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            YieldStackRoutes.YieldDepositApproval,
            routeParams,
        );
    });

    it('guards duplicate starts while allowance initialization is pending', async () => {
        const store = buildStore();
        let resolveAllowance: (value: ReturnType<typeof allowanceSubunits>) => void = () => {};
        fetchAllowanceMock.mockReturnValue(
            new Promise(resolve => {
                resolveAllowance = resolve;
            }),
        );
        const { result } = renderUseStartYieldDepositFlow(store);
        let startPromise: Promise<boolean> = Promise.resolve(false);
        let duplicateStartPromise: Promise<boolean> = Promise.resolve(false);

        act(() => {
            startPromise = result.current.handleStartYieldDepositFlow();
            duplicateStartPromise = result.current.handleStartYieldDepositFlow();
        });

        expect(fetchAllowanceMock).toHaveBeenCalledTimes(1);
        expect(mockNavigate).not.toHaveBeenCalled();

        await act(async () => {
            resolveAllowance(allowanceSubunits('1000000'));
            await expect(startPromise).resolves.toBe(true);
            await expect(duplicateStartPromise).resolves.toBe(false);
        });

        expect(fetchAllowanceMock).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(YieldStackRoutes.YieldDeposit, routeParams);
    });
});
