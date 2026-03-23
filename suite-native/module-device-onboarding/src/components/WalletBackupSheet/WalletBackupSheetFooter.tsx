import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { type BackupType } from '@suite-common/suite-types';
import { Box, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { hexToRgba } from '@trezor/utils';

import { walletBackupSheetCopyByType } from './presets';

const buttonStyle = prepareNativeStyle(utils => ({
    marginHorizontal: utils.spacings.sp16,
}));

const linearGradientStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    width: '100%',
    height: utils.spacings.sp32,
    top: -utils.spacings.sp32,
}));

interface CardFooterProps {
    onSubmit: () => void;
    selectedType: BackupType;
}

const containerStyle = prepareNativeStyle<{ marginBottom: number }>((_, { marginBottom }) => ({
    marginBottom,
}));

export const WalletBackupSheetFooter = ({ onSubmit, selectedType }: CardFooterProps) => {
    const { utils, applyStyle } = useNativeStyles();

    const backgroundColor = utils.colors.backgroundSurfaceElevation0;
    const transparentColor = hexToRgba(backgroundColor, 0.01);
    const { bottom } = useSafeAreaInsets();

    return (
        <Box style={applyStyle(containerStyle, { marginBottom: bottom })}>
            <LinearGradient
                colors={[transparentColor, backgroundColor]}
                style={applyStyle(linearGradientStyle)}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />
            <Button onPress={onSubmit} size="medium" style={applyStyle(buttonStyle)}>
                <Translation id={walletBackupSheetCopyByType[selectedType].submitButton} />
            </Button>
        </Box>
    );
};
