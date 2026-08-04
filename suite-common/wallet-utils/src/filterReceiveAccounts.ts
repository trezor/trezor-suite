import {
    type AccountType,
    type NetworkConfigDeps,
    type NetworkSymbol,
} from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';

import { sortByCoin } from './accountUtils';

export const isDebugOnlyAccountType = (
    deps: NetworkConfigDeps,
    accountType: AccountType,
    symbol?: NetworkSymbol,
): boolean => {
    if (!symbol) return false;

    const network = deps.getNetworkConfig(symbol);

    const accountTypeInfo = network.accountTypes[accountType];

    return !!accountTypeInfo?.isDebugOnlyAccountType;
};

type FilterReceiveAccountsProps = NetworkConfigDeps & {
    accounts: Account[];
    deviceState?: StaticSessionId;
    symbol?: NetworkSymbol;
    isDebug: boolean;
};

export const filterReceiveAccounts = ({
    accounts,
    deviceState,
    symbol,
    isDebug,
    getNetworkConfig,
    networkModuleRepository,
}: FilterReceiveAccountsProps): Account[] => {
    const isSameDevice = (account: Account) => account.deviceState === deviceState;
    const isSameNetwork = (account: Account) => account.symbol === symbol;
    const isNotEmptyAccount = (account: Account) => !account.empty;
    const shouldDisplayDebugOnly = (account: Account) =>
        isDebug ||
        !isDebugOnlyAccountType(
            { getNetworkConfig, networkModuleRepository },
            account.accountType,
            account.symbol,
        ) ||
        isNotEmptyAccount(account);
    const isVisibleAccount = (account: Account) => account.visible;
    const isFirstNormalAccount = (account: Account) =>
        account.accountType === 'normal' && account.index === 0;
    const isCoinjoinAccount = (account: Account) => account.accountType === 'coinjoin';

    const isRelevantAccount = (account: Account) =>
        isSameDevice(account) &&
        isSameNetwork(account) &&
        !isCoinjoinAccount(account) &&
        shouldDisplayDebugOnly(account) &&
        (isNotEmptyAccount(account) || isVisibleAccount(account) || isFirstNormalAccount(account));

    return sortByCoin(
        { getNetworkConfig, networkModuleRepository },
        accounts.filter(isRelevantAccount),
    );
};
