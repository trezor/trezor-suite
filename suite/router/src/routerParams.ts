import { yup } from '@suite/forms';
import {
    type AccountType,
    type NetworkSymbol,
    WATCH_ONLY_ACCOUNT_TYPE,
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
    'watch-imported',
    'placeholder',
    'legacy',
    'segwit',
    'coinjoin',
    'taproot',
    'ledger',
] as const satisfies readonly AccountType[];

const earnParamsSchema = yup.object({
    symbol: yup.mixed<NetworkSymbol>().required(),
    accountIndex: yup.number().required(),
    accountType: yup.mixed<AccountType>().oneOf(accountTypes).required(),
    vaultAddress: yup.string().optional(),
});

export type EarnParams = yup.InferType<typeof earnParamsSchema>;

export function parseEarnParams(params: unknown): EarnParams | undefined {
    try {
        return earnParamsSchema.validateSync(params, { abortEarly: false, strict: true });
    } catch {
        return undefined;
    }
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

export type WatchAccountParams = {
    symbol: NetworkSymbol;
    address: string;
};

export const parseWatchAccountParams = ({
    symbol,
    address,
}: Partial<Record<keyof WatchAccountParams, string>>): WatchAccountParams | undefined =>
    symbol !== undefined && isNetworkSymbol(symbol) && address ? { symbol, address } : undefined;

const dashboardParamsSchema = yup.object({
    networkSymbol: yup.mixed<NetworkSymbol>().notRequired(),
    modal: yup.mixed<NonNullable<GlobalSendReceiveType>>().oneOf(['send', 'receive']).required(),
});

export type DashboardParams = yup.InferType<typeof dashboardParamsSchema>;

export function parseDashboardParams(params: unknown): DashboardParams | undefined {
    try {
        return dashboardParamsSchema.validateSync(params, { abortEarly: false, strict: true });
    } catch {
        return undefined;
    }
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
    // Watch-only isn't a derivation of the network, but its accounts have their own routes.
    if (accountType !== WATCH_ONLY_ACCOUNT_TYPE && !isAccountOfNetwork(network, accountType))
        return;

    const accountIndex = parseInt(index, 10);
    if (Number.isNaN(accountIndex)) return;

    return {
        symbol: network.symbol,
        accountIndex,
        accountType,
    };
};
