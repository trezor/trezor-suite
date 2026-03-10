import { RouteProp, useRoute } from '@react-navigation/native';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { AccountLabel } from '@suite-native/labeling';
import { RootStackParamList, RootStackRoutes, ScreenHeader } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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
    const coinName = getNetworkDisplaySymbolName(networkSymbol);

    return (
        <ScreenHeader
            customContent={
                <HStack style={applyStyle(headerStyle)}>
                    <CryptoIcon symbol={networkSymbol} size="small" />
                    <VStack spacing="sp0" style={applyStyle(textColumnStyle)}>
                        <Text
                            variant="body-md-strong"
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {coinName}
                        </Text>
                        <Text variant="body-sm" color="textSubdued" numberOfLines={1} ellipsizeMode="tail">
                            <AccountLabel
                                accountDescriptor={accountDescriptor}
                                networkSymbol={networkSymbol}
                                deviceStaticSessionId={deviceStaticSessionId}
                            />
                        </Text>
                    </VStack>
                </HStack>
            }
            closeActionType="back"
        />
    );
};
