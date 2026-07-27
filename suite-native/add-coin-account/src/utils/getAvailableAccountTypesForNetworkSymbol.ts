import {
    type AccountType,
    NORMAL_ACCOUNT_TYPE,
    type NetworkConfig,
    type NetworkSymbol,
    networks,
} from '@suite-common/wallet-config';
import { typedObjectKeys } from '@trezor/utils';

const networkSymbolsWithOnlyNormalAccountType = new Set<NetworkSymbol>([
    'ada',
    'eth',
    'pol',
    'bsc',
    'sol',
    'op',
    'base',
    'arb',
    'rhc',
    'hype',
    'avax',
]);

export const getAvailableAccountTypesForNetworkSymbol = ({
    symbol,
}: {
    symbol: NetworkSymbol;
}): [AccountType, ...AccountType[]] => {
    const networkConfig = networks[symbol] as NetworkConfig | undefined;
    if (!networkConfig) {
        return [NORMAL_ACCOUNT_TYPE];
    }

    const accountTypes = typedObjectKeys(networkConfig.accountTypes).filter(
        accountType => !['coinjoin', 'imported', 'ledger'].includes(accountType),
    );
    const supportsOnlyNormalAccountType = networkSymbolsWithOnlyNormalAccountType.has(symbol);

    return [NORMAL_ACCOUNT_TYPE, ...(supportsOnlyNormalAccountType ? [] : accountTypes)];
};
