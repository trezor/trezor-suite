import { type RouteProp, useRoute } from '@react-navigation/native';

import { parseAccountKey } from '@suite-common/wallet-utils';
import { Box, HStack, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { AccountLabel } from '@suite-native/labeling';
import {
    type RootStackParamList,
    type RootStackRoutes,
    ScreenHeader,
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
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingManagement>>();
    const { accountKey } = route.params;

    const { accountDescriptor, networkSymbol, deviceStaticSessionId } = parseAccountKey(accountKey);

    return (
        <ScreenHeader
            customContent={
                <HStack spacing="sp12" style={applyStyle(headerStyle)}>
                    <CryptoIcon symbol={networkSymbol} size="small" />
                    <Box style={applyStyle(textColumnStyle)}>
                        <Text variant="body-md-strong" ellipsizeMode="tail" numberOfLines={1}>
                            <Translation id="earn.stakingDetailScreen.title" />
                        </Text>
                        <Text variant="body-sm" numberOfLines={1} ellipsizeMode="tail">
                            <AccountLabel
                                accountDescriptor={accountDescriptor}
                                networkSymbol={networkSymbol}
                                deviceStaticSessionId={deviceStaticSessionId}
                                color="contentSecondary"
                                variant="body-sm"
                            />
                        </Text>
                    </Box>
                </HStack>
            }
            closeActionType="back"
        />
    );
};
