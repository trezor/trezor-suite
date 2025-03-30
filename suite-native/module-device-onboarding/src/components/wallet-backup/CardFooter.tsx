import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Box, Button, DEFAULT_INSET_BOTTOM } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { getScreenWidth } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { hexToRgba } from '@trezor/utils';

import { WalletBackupType } from '../../../hooks/useWalletBackupPicker';

const SCREEN_WIDTH = getScreenWidth();

const containerStyle = prepareNativeStyle<{ insetBottom: number }>((_, { insetBottom }) => ({
    position: 'absolute',
    bottom: insetBottom,
    width: '100%',
}));

const buttonContainerStyle = prepareNativeStyle(utils => ({
    width: '100%',
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    alignItems: 'center',
}));

const buttonStyle = prepareNativeStyle(utils => ({
    width: SCREEN_WIDTH - 2 * utils.spacings.sp16,
}));

const linearGradientStyle = prepareNativeStyle(utils => ({
    width: '100%',
    height: utils.spacings.sp32,
}));

interface CardFooterProps {
    onSubmit: () => void;
    selectedType: WalletBackupType;
}

export const CardFooter = ({ onSubmit, selectedType }: CardFooterProps) => {
    const insets = useSafeAreaInsets();
    const { utils, applyStyle } = useNativeStyles();

    const insetBottom = Math.max(insets.bottom, DEFAULT_INSET_BOTTOM);

    const backgroundColor = utils.colors.backgroundSurfaceElevation0;
    const transparentColor = hexToRgba(backgroundColor, 0.01);

    return (
        <Box style={applyStyle(containerStyle, { insetBottom })}>
            <LinearGradient
                colors={[transparentColor, backgroundColor]}
                style={applyStyle(linearGradientStyle)}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />
            <Box style={applyStyle(buttonContainerStyle)}>
                <Button onPress={onSubmit} size="large" style={applyStyle(buttonStyle)}>
                    <Translation
                        id={`moduleDeviceOnboarding.walletBackupSheet.options.${selectedType}.submitButton`}
                    />
                </Button>
            </Box>
        </Box>
    );
};
