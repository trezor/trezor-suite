/**
 * Disables graph data fetching for E2E tests to mitigate flakiness.
 */

import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import {
    type AccountItem,
    type FiatGraphPoint,
    type FiatGraphPointWithCryptoBalance,
    type GroupedBalanceMovementEvent,
} from './types';

export type CommonUseGraphParams = {
    baseCurrencyCode: BaseCurrencyCode;
};

// if start date is null we are fetching all data till first account movement
type StartOfTimeFrameDate = Date | null;

type useGraphForAccountsParams<TIsPortfolioGraph extends boolean = boolean> =
    CommonUseGraphParams & {
        accounts: AccountItem[];
        endOfTimeFrameDate: Date;
        startOfTimeFrameDate: StartOfTimeFrameDate;
        isPortfolioGraph: TIsPortfolioGraph;
        isElectrumBackend: boolean;
    };

type CommonUseGraphReturnType = {
    graphEvents?: GroupedBalanceMovementEvent[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
};

export function useGraphForAccounts(_params: useGraphForAccountsParams<false>): {
    graphPoints: FiatGraphPointWithCryptoBalance[];
} & CommonUseGraphReturnType;
export function useGraphForAccounts(_params: useGraphForAccountsParams<true>): {
    graphPoints: FiatGraphPoint[];
} & CommonUseGraphReturnType;
export function useGraphForAccounts(_params: useGraphForAccountsParams): {
    graphPoints: FiatGraphPoint[] | FiatGraphPointWithCryptoBalance[];
} & CommonUseGraphReturnType {
    return {
        graphPoints: [],
        graphEvents: [],
        isLoading: false,
        error: { message: 'Graph is disabled for E2E tests for performance reasons.' } as Error,
        refetch: () => Promise.resolve(),
    };
}

export const useGetTimeFrameForHistoryHours = (_timeframeHours: number | null) => ({
    endOfTimeFrameDate: new Date(),
    startOfTimeFrameDate: null,
});
