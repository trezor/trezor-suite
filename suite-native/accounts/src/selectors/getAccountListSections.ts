import { SimpleTokenStructure, filterKnownTokens } from '@suite-common/token-definitions';
import { Account, TokenInfoBranded } from '@suite-common/wallet-types';
import { getAccountTotalStakingBalance, isCardanoStakingActive } from '@suite-common/wallet-utils';
import { doesCoinSupportStaking } from '@suite-native/staking';
import { isNetworkWithTokens } from '@suite-native/tokens';

import { AccountSelectBottomSheetSection } from '../types';

export const getAccountListSections = (
    account: Account,
    tokenDefinitions: SimpleTokenStructure | undefined,
) => {
    const sections: AccountSelectBottomSheetSection[] = [];
    const isNetworkSupportingTokens = isNetworkWithTokens(account.symbol);

    // TODO: unify with desktop when token management is ready,
    // unhide token during activation automatically
    // For Stellar, show all tokens without filtering.
    // Unlike EVM chains where tokens can be airdropped as spam, Stellar tokens (trustlines)
    // require explicit user action to activate. See tokensSelectors.ts for details.
    const tokens =
        account.networkType === 'stellar'
            ? (account.tokens ?? [])
            : filterKnownTokens(tokenDefinitions, account.symbol, account.tokens ?? []);
    const hasAnyKnownTokens = isNetworkSupportingTokens && !!tokens.length;

    const stakingBalance = getAccountTotalStakingBalance(account) ?? '0';

    const hasStakingBalance = stakingBalance !== '0' || isCardanoStakingActive(account);
    const hasStaking = doesCoinSupportStaking(account.symbol) && hasStakingBalance;

    if (isNetworkSupportingTokens) {
        sections.push({
            type: 'sectionTitle',
            account,
            hasAnyKnownTokens,
        });
    }
    sections.push({
        type: 'account',
        account,
        isLast: !hasAnyKnownTokens && !hasStaking,
        isFirst: true,
        hasAnyKnownTokens,
    });

    if (hasStaking) {
        sections.push({
            type: 'staking',
            account,
            stakingCryptoBalance: stakingBalance,
            isLast: !hasAnyKnownTokens,
        });
    }

    if (hasAnyKnownTokens) {
        // For Stellar, show all tokens (trustlines) regardless of balance since they are explicitly activated
        // For other networks, only show tokens with balance > 0
        const tokensToShow =
            account.networkType === 'stellar'
                ? tokens
                : tokens.filter(token => parseFloat(token?.balance ?? '0') > 0);
        tokensToShow.forEach((token, index) => {
            sections.push({
                type: 'token',
                account,
                token: token as TokenInfoBranded,
                isLast: index === tokensToShow.length - 1,
            });
        });
    }

    return sections;
};
