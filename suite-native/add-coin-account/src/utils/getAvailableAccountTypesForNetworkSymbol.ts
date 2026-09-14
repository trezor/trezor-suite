import { type NetworkConfigDeps } from '@suite-common/networks';
import {
    type AccountType,
    NORMAL_ACCOUNT_TYPE,
    type NetworkConfig,
    type NetworkSymbol,
    getNetwork,
} from '@suite-common/wallet-config';
import { isEvmNetwork } from '@suite-common/wallet-utils';
import { typedObjectKeys } from '@trezor/utils';

const normalOnlyNonEvmNetworkSymbols: NetworkSymbol[] = ['ada', 'sol'];

export const getAvailableAccountTypesForNetworkSymbol = (
    networkConfigDeps: NetworkConfigDeps,
    {
        symbol,
    }: {
        symbol: NetworkSymbol;
    },
): [AccountType, ...AccountType[]] => {
    const networkConfig = getNetwork(networkConfigDeps, symbol) as NetworkConfig | undefined;
    if (!networkConfig) {
        return [NORMAL_ACCOUNT_TYPE];
    }

    const supportsOnlyNormalAccountType =
        isEvmNetwork(networkConfigDeps, symbol) || normalOnlyNonEvmNetworkSymbols.includes(symbol);
    if (supportsOnlyNormalAccountType) {
        return [NORMAL_ACCOUNT_TYPE];
    }

    const accountTypes = typedObjectKeys(networkConfig.accountTypes).filter(
        accountType => !['coinjoin', 'imported', 'ledger'].includes(accountType),
    );

    return [NORMAL_ACCOUNT_TYPE, ...accountTypes];
};
