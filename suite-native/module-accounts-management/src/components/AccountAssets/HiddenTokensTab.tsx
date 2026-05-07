import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type AccountsRootState,
    type TokensRootState,
    selectAccountByKey,
    selectAccountHiddenTokens,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { AccountsListTokenItem } from '@suite-native/accounts';
import { Card, PictogramTitleHeader, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type HiddenTokensTabProps = {
    accountKey: AccountKey;
};

export const HiddenTokensTab = ({ accountKey }: HiddenTokensTabProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountAssets>>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const hiddenTokens = useSelector((state: TokensRootState) =>
        selectAccountHiddenTokens(state, accountKey),
    );

    if (hiddenTokens.length === 0) {
        return (
            <VStack spacing="sp24" marginTop="sp24">
                <PictogramTitleHeader
                    variant="info"
                    icon="eyeSlash"
                    title={
                        <Translation id="moduleAccountManagement.accountAssetsScreen.hiddenTokensSection.emptyTitle" />
                    }
                    subtitle={
                        <Translation id="moduleAccountManagement.accountAssetsScreen.hiddenTokensSection.emptySubtitle" />
                    }
                />
            </VStack>
        );
    }

    if (!account) return null;

    return (
        <VStack spacing="sp16">
            <Text variant="headline-sm">
                <Translation id="moduleAccountManagement.accountAssetsScreen.hiddenTokensSection.title" />
            </Text>
            <Card
                noPadding
                alertProps={{
                    variant: 'warning',
                    title: (
                        <Translation id="moduleAccountManagement.accountAssetsScreen.hiddenTokensSection.warning" />
                    ),
                }}
            >
                {hiddenTokens.map((token, index) => (
                    <AccountsListTokenItem
                        key={token.contract}
                        token={token}
                        account={account}
                        isLast={index === hiddenTokens.length - 1}
                        showFiatValue={false}
                        onSelectAccount={() =>
                            navigation.navigate(RootStackRoutes.AccountDetail, {
                                accountKey,
                                tokenContract: token.contract,
                                closeActionType: 'back',
                            })
                        }
                    />
                ))}
            </Card>
        </VStack>
    );
};
