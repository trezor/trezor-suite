import { yup } from '@suite-common/validators';
import {
    type AccountType,
    type NetworkConfigDeps,
    type NetworkSymbol,
    isAccountOfNetwork,
    toNetwork,
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

export const validateAccountRouteParams = (
    deps: NetworkConfigDeps,
    {
        symbol,
        index,
        rawAccountType,
    }: {
        symbol?: string;
        index?: string;
        rawAccountType?: string;
    },
): CommonWalletParams => {
    if (!index) return;

    const networkSymbol = deps.networkModuleRepository
        .getSupportedNetworks()
        .find(supportedNetwork => supportedNetwork === symbol);
    if (!networkSymbol) return;
    const network = toNetwork(networkSymbol, deps.getNetworkConfig(networkSymbol));

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
