import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps } from '@suite-common/networks';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { type Account, type RatesByKey } from '@suite-common/wallet-types';
import { getTotalFiatBalance } from '@suite-common/wallet-utils/src/accountUtils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { useSelector } from 'src/hooks/suite';
import { getTokens } from 'src/utils/wallet/tokenUtils';

export const useTotalFiatBalance = (
    accounts: Account[],
    baseCurrencyCode: BaseCurrencyCode,
    rates?: RatesByKey,
) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const tokenDefinitions = useSelector(selectTokenDefinitions);
    const deviceAccounts: Account[] = accounts.map(account => {
        const coinDefinitions = tokenDefinitions?.[account.symbol]?.coin;
        const tokens = getTokens(networkConfigDeps, {
            tokens: account.tokens ?? [],
            symbol: account.symbol,
            tokenDefinitions: coinDefinitions,
        });

        return { ...account, tokens: tokens.shownWithBalance };
    });

    const totalBaseCurrencyBalance = getTotalFiatBalance(networkConfigDeps, {
        deviceAccounts,
        baseCurrencyCode,
        rates,
    }).toString();

    return totalBaseCurrencyBalance;
};
