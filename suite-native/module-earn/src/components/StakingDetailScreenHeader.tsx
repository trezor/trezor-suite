import { type RouteProp, useRoute } from '@react-navigation/native';

import { parseAccountKey } from '@suite-common/wallet-utils';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
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

const headerTextStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

export const StakingDetailScreenHeader = () => {
    const { applyStyle } = useNativeStyles();

    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingDetail>>();
    const { accountKey } = route.params;

    const { accountDescriptor, networkSymbol, deviceStaticSessionId } = parseAccountKey(accountKey);

    return (
        <ScreenHeader
            customContent={
                <>
                    <HStack style={applyStyle(headerStyle)}>
                        <Icon name="piggyBankFilled" color="iconSubdued" />
                        <Text
                            variant="body-md-strong"
                            ellipsizeMode="tail"
                            numberOfLines={1}
                            style={applyStyle(headerTextStyle)}
                        >
                            <Translation id="earn.stakingDetailScreen.title" />
                        </Text>
                    </HStack>
                    <Text variant="body-sm" color="textSubdued">
                        <AccountLabel
                            accountDescriptor={accountDescriptor}
                            networkSymbol={networkSymbol}
                            deviceStaticSessionId={deviceStaticSessionId}
                        />
                    </Text>
                </>
            }
            closeActionType="back"
        />
    );
};
