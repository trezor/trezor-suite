import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type BlockchainRootState,
    selectIsCustomBackendConfigured,
} from '@suite-common/wallet-core';
import { Box, IconButton } from '@suite-native/atoms';
import {
    type RootStackParamList,
    RootStackRoutes,
    SettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type NetworkBackendsButtonProps = {
    symbol: NetworkSymbol;
};

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

const configIndicatorStyle = prepareNativeStyle(({ borders, colors }) => ({
    position: 'absolute',
    top: -6,
    right: -6,
    width: 14,
    height: 14,
    borderRadius: borders.radii.round,
    borderWidth: borders.widths.large,
    borderColor: colors.elementFillElevated,
    backgroundColor: colors.elementFillNeutralBold,
}));

export const NetworkBackendsButton = ({ symbol }: NetworkBackendsButtonProps) => {
    const navigation = useNavigation<NavigationProps>();
    const { applyStyle } = useNativeStyles();

    const isCustomBackendConfigured = useSelector((state: BlockchainRootState) =>
        selectIsCustomBackendConfigured(state, symbol),
    );

    const navigateToNetworkBackends = () =>
        navigation.navigate(RootStackRoutes.SettingsScreenStack, {
            screen: SettingsStackRoutes.BitcoinBackends,
        });

    return (
        <Box>
            <IconButton
                iconName="sliders"
                // @ts-expect-error `small` icon button size was deprecated, but there is no replacement for this usage yet.
                size="small"
                intent="neutral"
                priority="secondary"
                hitSlop={8}
                onPress={navigateToNetworkBackends}
            />
            {isCustomBackendConfigured && <Box style={applyStyle(configIndicatorStyle)} />}
        </Box>
    );
};
