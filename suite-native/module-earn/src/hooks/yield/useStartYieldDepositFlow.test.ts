import { combineReducers } from '@reduxjs/toolkit';

import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import {
    type YieldFlowResolvedData,
    type YieldRootState,
    fetchAllowance,
    fetchWrappedNativeTokenInfo,
    selectYieldSession,
    yieldActions,
    yieldReducer,
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

import { useStartYieldDepositFlow } from './useStartYieldDepositFlow';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

jest.mock('@suite-common/wallet-core/src/allowance/fetchAllowance');
jest.mock('@suite-common/wallet-core/src/yield/utils/fetchWrappedNativeTokenInfo');

const fetchAllowanceMock = jest.mocked(fetchAllowance);
const fetchWrappedNativeTokenInfoMock = jest.mocked(fetchWrappedNativeTokenInfo);

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
    networkType: 'ethereum',
    descriptor: ownerAddress,
    tokens: [],
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

const wethTokenContract = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as TokenAddress;
const wethFlowKey = `${accountKey}:${yieldId}:${wethTokenContract}`;
const wethRouteParams = {
    accountKey,
    tokenContract: wethTokenContract,
    yieldId,
} satisfies YieldFlowParams;

const wethFlowData = {
    ...flowData,
    token: {
        balance: '0',
        contractAddress: wethTokenContract,
        decimals: 18,
        networkSymbol: 'eth',
        symbol: 'WETH',
    },
} satisfies YieldFlowResolvedData;

const allowanceSubunits = (value: string) => asAmountSubunit(new BigNumber(value));

const buildStore = (storeAccount: Account = account) =>
    createLightStore({
        reducer: {
            locale: createStaticReducer({
                appLocaleCode: 'en-US',
                systemLocaleCode: 'en-US',
                isSystemLocaleUsed: true,
            }),
            wallet: combineReducers({
                accounts: createStaticReducer([storeAccount]),
                settings: createStaticReducer({
                    localCurrency: 'usd',
                    bitcoinAmountUnit: 0,
                }),
                stablecoinYield: yieldReducer,
            }),
        },
    });

type HookParams = {
    flowData: YieldFlowResolvedData;
    flowKey: string;
    routeParams: YieldFlowParams;
};

const defaultHookParams: HookParams = { flowData, flowKey, routeParams };
const wethHookParams: HookParams = {
    flowData: wethFlowData,
    flowKey: wethFlowKey,
    routeParams: wethRouteParams,
};

const renderUseStartYieldDepositFlow = async (
    store: TestStore,
    hookParams: HookParams = defaultHookParams,
) => await renderHookWithStoreProvider(() => useStartYieldDepositFlow(hookParams), { store });

describe('useStartYieldDepositFlow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fetchAllowanceMock.mockResolvedValue(allowanceSubunits('0'));
        fetchWrappedNativeTokenInfoMock.mockResolvedValue(null);
    });

    it('navigates to deposit when allowance initialization skips to action step', async () => {
        const store = buildStore();
        fetchAllowanceMock.mockResolvedValue(allowanceSubunits('1000000'));
        const { result } = await renderUseStartYieldDepositFlow(store);

        await act(async () => {
            await result.current.handleStartYieldDepositFlow();
        });

        expect(mockNavigate).toHaveBeenCalledWith(YieldStackRoutes.YieldDeposit, routeParams);
    });

    it('navigates to approval when allowance is zero', async () => {
        const store = buildStore();
        const { result } = await renderUseStartYieldDepositFlow(store);

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
        store.dispatch(yieldActions.resetSession(sessionParams));
        store.dispatch(yieldActions.skipApprovalStep(sessionParams));
        const { result } = await renderUseStartYieldDepositFlow(store);

        await act(async () => {
            await result.current.handleStartYieldDepositFlow();
        });

        const session = selectYieldSession(store.getState() as YieldRootState, 'deposit', flowKey);

        expect(session.step).toBe('approve');
        expect(mockNavigate).toHaveBeenCalledWith(
            YieldStackRoutes.YieldDepositApproval,
            routeParams,
        );
    });

    it('falls back to approval when allowance initialization fails', async () => {
        const store = buildStore();
        fetchAllowanceMock.mockRejectedValue(new Error('Allowance unavailable.'));
        const { result } = await renderUseStartYieldDepositFlow(store);

        await act(async () => {
            await result.current.handleStartYieldDepositFlow();
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            YieldStackRoutes.YieldDepositApproval,
            routeParams,
        );
    });

    it('skips the wrap step when an untracked wrapped-native balance is found on chain', async () => {
        const store = buildStore();
        fetchWrappedNativeTokenInfoMock.mockResolvedValue({
            standard: 'ERC20',
            contract: wethTokenContract,
            symbol: 'WETH',
            name: 'Wrapped Ether',
            decimals: 18,
            balance: '2500000000000000000',
        });
        const { result } = await renderUseStartYieldDepositFlow(store, wethHookParams);

        await act(async () => {
            await result.current.handleStartYieldDepositFlow();
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            YieldStackRoutes.YieldDepositApproval,
            wethRouteParams,
        );
    });

    it('skips the wrap step when the wrapped-native token is already tracked with a balance', async () => {
        const trackedAccount = {
            ...account,
            tokens: [{ contract: wethTokenContract, symbol: 'WETH', decimals: 18, balance: '3' }],
        } as unknown as Account;
        const store = buildStore(trackedAccount);
        const { result } = await renderUseStartYieldDepositFlow(store, wethHookParams);

        await act(async () => {
            await result.current.handleStartYieldDepositFlow();
        });

        expect(fetchWrappedNativeTokenInfoMock).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith(
            YieldStackRoutes.YieldDepositApproval,
            wethRouteParams,
        );
    });

    it('starts on the wrap step when no wrapped-native balance exists', async () => {
        const store = buildStore();
        const { result } = await renderUseStartYieldDepositFlow(store, wethHookParams);

        await act(async () => {
            await result.current.handleStartYieldDepositFlow();
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            YieldStackRoutes.YieldDepositWrap,
            wethRouteParams,
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
        const { result } = await renderUseStartYieldDepositFlow(store);
        let startPromise: Promise<boolean> = Promise.resolve(false);
        let duplicateStartPromise: Promise<boolean> = Promise.resolve(false);

        await act(() => {
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
