import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type AccountKey } from '@suite-common/wallet-types';
import {
    AccountsListItem,
    AccountsListStakingItem,
    AccountsListTokenItem,
    type NativeAccountsRootState,
    type OnSelectAccount,
    selectAccountListSections,
} from '@suite-native/accounts';
import { Box } from '@suite-native/atoms';
import { useStakingDetailNavigation } from '@suite-native/module-earn';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type ActiveTokensTabProps = {
    accountKey: AccountKey;
};

export const ActiveTokensTab = ({ accountKey }: ActiveTokensTabProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountAssets>>();
    const { navigateToStakingDetail } = useStakingDetailNavigation();

    const sections = useSelector((state: NativeAccountsRootState) =>
        selectAccountListSections(state, accountKey),
    );

    const handleSelectAccount: OnSelectAccount = useCallback(
        ({ account, tokenAddress, isStaking }) => {
            if (isStaking) {
                navigateToStakingDetail({ accountKey: account.key, symbol: account.symbol });

                return;
            }
            navigation.navigate(RootStackRoutes.AccountDetail, {
                accountKey: account.key,
                tokenContract: tokenAddress,
                closeActionType: 'back',
            });
        },
        [navigation, navigateToStakingDetail],
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
                    default:
                        return null;
                }
            })}
        </Box>
    );
};
