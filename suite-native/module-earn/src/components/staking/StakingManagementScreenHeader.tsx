import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { AccountLabel } from '@suite-native/accounts';
import { Box, HStack, IconButton, Text } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const headerStyle = prepareNativeStyle(utils => ({
    flexShrink: 1,
    alignItems: 'center',
    gap: utils.spacings.sp8,
}));

const textColumnStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

export const StakingManagementScreenHeader = () => {
    const { applyStyle } = useNativeStyles();
    const navigation =
        useNavigation<
            StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>
        >();
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingManagement>>();
    const { accountKey } = route.params;

    const { accountDescriptor, networkSymbol, deviceStaticSessionId } = parseAccountKey(accountKey);

    const { networkType } = getNetwork(networkSymbol);
    const hasHowItWorks = networkType === 'ethereum' || networkType === 'solana';

    return (
        <ScreenHeader
            customContent={
                <HStack spacing="sp12" style={applyStyle(headerStyle)}>
                    <TokenIcon symbol={networkSymbol} size="small" />
                    <Box style={applyStyle(textColumnStyle)}>
                        <Text variant="body-md-strong" ellipsizeMode="tail" numberOfLines={1}>
                            <Translation id="earn.stakingDetailScreen.title" />
                        </Text>
                        <AccountLabel
                            accountDescriptor={accountDescriptor}
                            networkSymbol={networkSymbol}
                            deviceStaticSessionId={deviceStaticSessionId}
                            color="contentSecondary"
                            variant="body-sm"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            showAccountTypeBadge
                        />
                    </Box>
                </HStack>
            }
            rightIcon={
                hasHowItWorks && (
                    <IconButton
                        iconName="info"
                        intent="neutral"
                        priority="secondary"
                        size="medium"
                        onPress={() =>
                            navigation.navigate(RootStackRoutes.HowStakeWorksScreen, {
                                accountKey,
                                symbol: networkSymbol,
                                isInfoOnly: true,
                            })
                        }
                    />
                )
            }
            closeActionType="back"
        />
    );
};
