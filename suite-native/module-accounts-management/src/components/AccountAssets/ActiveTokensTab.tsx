import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { type AccountKey } from '@suite-common/wallet-types';
import {
    AccountsListItem,
    AccountsListStakingItem,
    AccountsListTokenItem,
    type NativeAccountsRootState,
    type OnSelectAccount,
    selectAccountListSectionsWithZeroBalanceGroup,
} from '@suite-native/accounts';
import { Box } from '@suite-native/atoms';
import { useStakingDetailNavigation } from '@suite-native/module-earn';

import { ZeroBalanceTokensSection } from './ZeroBalanceTokensSection';
import { type OnSelectAsset } from './types';

type ActiveTokensTabProps = {
    accountKey: AccountKey;
    onSelect: OnSelectAsset;
    isStakingDisplayed: boolean;
};

export const ActiveTokensTab = ({
    accountKey,
    onSelect,
    isStakingDisplayed,
}: ActiveTokensTabProps) => {
    const { navigateToStakingDetail } = useStakingDetailNavigation();

    const sections = useSelector((state: NativeAccountsRootState) =>
        selectAccountListSectionsWithZeroBalanceGroup(state, accountKey),
    );

    const handleSelectAccount: OnSelectAccount = useCallback(
        ({ account, tokenAddress, tokenSymbol, isStaking }) => {
            if (isStaking) {
                navigateToStakingDetail({ accountKey: account.key, symbol: account.symbol });

                return;
            }
            onSelect({ tokenContract: tokenAddress, tokenSymbol });
        },
        [onSelect, navigateToStakingDetail],
    );

    const items = sections.filter(item => item.type !== 'sectionTitle');

    return (
        <Box>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                switch (item.type) {
                    case 'account':
                        return (
                            <AccountsListItem
                                key={item.account.key}
                                {...item}
                                hasBackground
                                showDivider
                                isNativeCoinOnly
                                isLast={isLast}
                                onPress={handleSelectAccount}
                            />
                        );
                    case 'staking':
                        if (!isStakingDisplayed) return null;

                        return (
                            <AccountsListStakingItem
                                key={`${item.account.key}-staking`}
                                {...item}
                                hasBackground
                                isLast={isLast}
                                onPress={() =>
                                    handleSelectAccount({
                                        account: item.account,
                                        isStaking: true,
                                        hasAnyKnownTokens: false,
                                    })
                                }
                            />
                        );
                    case 'token':
                        return (
                            <AccountsListTokenItem
                                key={item.token.contract}
                                {...item}
                                hasBackground
                                isLast={isLast}
                                onSelectAccount={() =>
                                    handleSelectAccount({
                                        account: item.account,
                                        tokenAddress: item.token.contract,
                                        tokenSymbol: item.token.symbol,
                                        hasAnyKnownTokens: true,
                                    })
                                }
                            />
                        );
                    case 'zeroBalance':
                        return (
                            <ZeroBalanceTokensSection
                                key="zero-balance"
                                tokens={item.tokens}
                                account={item.account}
                                onSelect={onSelect}
                            />
                        );
                    default:
                        return null;
                }
            })}
        </Box>
    );
};
