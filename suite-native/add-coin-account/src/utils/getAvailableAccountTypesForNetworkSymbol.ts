import {
    type AccountType,
    NORMAL_ACCOUNT_TYPE,
    type NetworkSymbol,
    networks,
} from '@suite-common/wallet-config';
import { isEvmNetwork } from '@suite-common/wallet-utils';
import { typedObjectKeys } from '@trezor/utils';

export const getAvailableAccountTypesForNetworkSymbol = ({
    symbol,
}: {
    symbol: NetworkSymbol;
}): [AccountType, ...AccountType[]] => {
    const accountTypes = typedObjectKeys(networks[symbol].accountTypes).filter(
        accountType => !['coinjoin', 'imported', 'ledger'].includes(accountType),
    );
    const supportsOnlyNormalAccountType =
        isEvmNetwork(symbol) || symbol === 'ada' || symbol === 'sol';

    return [NORMAL_ACCOUNT_TYPE, ...(supportsOnlyNormalAccountType ? [] : accountTypes)];
};
