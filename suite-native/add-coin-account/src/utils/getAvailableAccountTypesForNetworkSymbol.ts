import {
    type AccountType,
    NORMAL_ACCOUNT_TYPE,
    type NetworkSymbol,
    asNetworkSymbol,
    networks,
} from '@suite-common/wallet-config';
import { isEvmNetwork } from '@suite-common/wallet-utils';
import { typedObjectKeys } from '@trezor/utils';

const normalOnlyNonEvmNetworkSymbols: NetworkSymbol[] = [
    asNetworkSymbol('ada'),
    asNetworkSymbol('sol'),
];

export const getAvailableAccountTypesForNetworkSymbol = ({
    symbol,
}: {
    symbol: NetworkSymbol;
}): [AccountType, ...AccountType[]] => {
    const networkConfig = networks[symbol];
    if (!networkConfig) {
        return [NORMAL_ACCOUNT_TYPE];
    }

    const supportsOnlyNormalAccountType =
        isEvmNetwork(symbol) || normalOnlyNonEvmNetworkSymbols.includes(symbol);
    if (supportsOnlyNormalAccountType) {
        return [NORMAL_ACCOUNT_TYPE];
    }

    const accountTypes = typedObjectKeys(networkConfig.accountTypes).filter(
        accountType => !['coinjoin', 'imported', 'ledger'].includes(accountType),
    );

    return [NORMAL_ACCOUNT_TYPE, ...accountTypes];
};
