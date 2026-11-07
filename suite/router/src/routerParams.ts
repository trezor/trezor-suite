import { z } from 'zod';

import {
    type AccountType,
    type NetworkSymbol,
    getNetworkOptional,
    isAccountOfNetwork,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import {
    type WalletParams as CommonWalletParams,
    type GlobalSendReceiveType,
} from '@suite-common/wallet-types';

const accountTypes = [
    'normal',
    'imported',
    'placeholder',
    'legacy',
    'segwit',
    'coinjoin',
    'taproot',
    'ledger',
] as const satisfies readonly AccountType[];

const isEarnAccountType = (accountType: unknown): accountType is AccountType =>
    accountTypes.some(earnAccountType => earnAccountType === accountType);

const earnParamsSchema = z.object({
    symbol: z.custom<NetworkSymbol>(symbol => symbol !== undefined && symbol !== null),
    accountIndex: z.number(),
    accountType: z.custom<AccountType>(isEarnAccountType),
    vaultAddress: z.string().optional(),
});

export type EarnParams = z.infer<typeof earnParamsSchema>;

// Type guards rather than `parse`, so callers get the router params object itself, not a copy.
const isEarnParams = (params: unknown): params is EarnParams =>
    earnParamsSchema.safeParse(params).success;

export function parseEarnParams(params: unknown): EarnParams | undefined {
    return isEarnParams(params) ? params : undefined;
}

export type AssetParams = {
    symbol: NetworkSymbol;
    contractAddress?: string;
};

export const parseAssetParams = ({
    symbol,
    contractAddress,
}: Partial<Record<keyof AssetParams, string>>): AssetParams | undefined =>
    symbol !== undefined && isNetworkSymbol(symbol) ? { symbol, contractAddress } : undefined;

const dashboardParamsSchema = z.object({
    networkSymbol: z.custom<NetworkSymbol>().nullish(),
    modal: z.enum(['send', 'receive'] satisfies NonNullable<GlobalSendReceiveType>[]),
});

export type DashboardParams = z.infer<typeof dashboardParamsSchema>;

const isDashboardParams = (params: unknown): params is DashboardParams =>
    dashboardParamsSchema.safeParse(params).success;

export function parseDashboardParams(params: unknown): DashboardParams | undefined {
    return isDashboardParams(params) ? params : undefined;
}

export const decodeEarnVaultAddress = (rawVaultAddress?: string): string | undefined => {
    if (!rawVaultAddress) {
        return undefined;
    }

    try {
        return decodeURIComponent(rawVaultAddress);
    } catch {
        return undefined;
    }
};
type ValidateAccountRouteParamsParams = {
    symbol?: string;
    index?: string;
    rawAccountType?: string;
};

export const validateAccountRouteParams = ({
    symbol,
    index,
    rawAccountType,
}: ValidateAccountRouteParamsParams): CommonWalletParams => {
    if (!index) return;

    const network = getNetworkOptional(symbol);
    if (!network) return;

    const accountType = rawAccountType || 'normal';
    if (!isAccountOfNetwork(network, accountType)) return;

    const accountIndex = parseInt(index, 10);
    if (Number.isNaN(accountIndex)) return;

    return {
        symbol: network.symbol,
        accountIndex,
        accountType,
    };
};
