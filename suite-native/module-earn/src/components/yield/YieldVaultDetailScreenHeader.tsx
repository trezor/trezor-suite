import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { parseAccountKey } from '@suite-common/wallet-utils';
import {
    AccountLabel,
    type NativeAccountsRootState,
    selectAccountFiatBalance,
} from '@suite-native/accounts';
import { Box, HStack, IconButton } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import {
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackNavigationProps,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useYieldFlowData } from '../../hooks/yield/useYieldFlowData';

const headerStyle = prepareNativeStyle(utils => ({
    flexShrink: 1,
    alignItems: 'center',
    gap: utils.spacings.sp8,
}));

const textColumnStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

interface YieldVaultDetailScreenHeaderProps {
    account: Account;
    tokenContract: TokenAddress;
}

export const YieldVaultDetailScreenHeader = ({
    account,
    tokenContract,
}: YieldVaultDetailScreenHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.YieldVaultDetail>>();

    const { networkSymbol, deviceStaticSessionId } = parseAccountKey(account.key);

    const fiatBalance = useSelector((state: NativeAccountsRootState) =>
        selectAccountFiatBalance(state, account.key),
    );

    const { vault } = useYieldFlowData({
        accountKey: account.key,
        tokenContract,
        displayError: false,
    });

    return (
        <>
            <ScreenHeader
                customContent={
                    <HStack spacing="sp12" style={applyStyle(headerStyle)}>
                        <TokenIcon symbol={networkSymbol} size="small" />
                        <Box style={applyStyle(textColumnStyle)}>
                            <AccountLabel
                                accountDescriptor={account.descriptor}
                                networkSymbol={networkSymbol}
                                deviceStaticSessionId={deviceStaticSessionId}
                                variant="body-md-strong"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                showAccountTypeBadge
                            />

                            <BaseCurrencyAmountFormatter
                                value={fiatBalance}
                                variant="body-sm"
                                color="contentSecondary"
                            />
                        </Box>
                    </HStack>
                }
                rightIcon={
                    vault && (
                        <IconButton
                            intent="neutral"
                            priority="secondary"
                            size="medium"
                            iconName="info"
                            onPress={() =>
                                navigation.navigate(RootStackRoutes.YieldNavigator, {
                                    screen: YieldStackRoutes.HowYieldWorks,
                                    params: {
                                        accountKey: account.key,
                                        tokenContract,
                                        isInfoOnly: true,
                                    },
                                })
                            }
                        />
                    )
                }
                closeActionType="back"
            />
        </>
    );
};
