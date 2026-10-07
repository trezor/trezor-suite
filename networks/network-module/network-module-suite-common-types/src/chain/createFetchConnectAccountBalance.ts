import type { GetTrezorConnectDep } from '@trezor/connect-common';

import type { ChainAccountBalance } from './ChainAccountBalance';
import type { GetAccountBalanceParams } from './ChainNetwork';
import { ChainNetworkError } from './ChainNetworkError';
import { subunitsToUnits } from './subunitsToUnits';
import { toCoinSymbol } from './toCoinSymbol';

export type FetchConnectAccountBalanceDeps = GetTrezorConnectDep<'getAccountInfo'>;

export type FetchConnectAccountBalanceParams = GetAccountBalanceParams & {
    decimals: number;

    /** Which balance the network shows; reserve-based networks show the full balance. */
    displayBalance: 'availableBalance' | 'balance';
    useConnectionIdentity: boolean;
    gap?: number;
};

export type FetchConnectAccountBalance = (
    params: FetchConnectAccountBalanceParams,
) => Promise<ChainAccountBalance>;

/**
 * Reads an account's native balance through Connect, whatever backend Connect is set to.
 *
 * Connect calls cannot be cancelled, so an aborted request still completes; its result is then
 * discarded by the caller.
 */
export const createFetchConnectAccountBalance =
    (deps: FetchConnectAccountBalanceDeps): FetchConnectAccountBalance =>
    async params => {
        const result = await deps.getTrezorConnect().getAccountInfo({
            coin: toCoinSymbol(params.ref.symbol),
            descriptor: params.ref.descriptor,
            details: 'basic',
            suppressBackupWarning: true,
            identity: params.useConnectionIdentity ? params.ref.connectionIdentity : undefined,
            gap: params.gap,
        });

        // The backend message can echo the descriptor, so it is dropped here.
        if (!result.success) {
            throw new ChainNetworkError('account-info-failed', params.ref.symbol);
        }

        const balance = subunitsToUnits(result.payload.balance, params.decimals);
        const availableBalance = subunitsToUnits(result.payload.availableBalance, params.decimals);

        return {
            balance,
            availableBalance,
            displayBalance: params.displayBalance === 'balance' ? balance : availableBalance,
            empty: result.payload.empty,
        };
    };
