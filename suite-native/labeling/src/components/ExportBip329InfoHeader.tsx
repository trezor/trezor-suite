import { Box, PictogramTitleHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const overlayStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    padding: utils.spacings.sp16,
}));

export const ExportBip329InfoHeader = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(overlayStyle)}>
            <PictogramTitleHeader
                variant="info"
                title={<Translation id="moduleLabeling.exportBip329BottomSheet.description" />}
            />
        </Box>
    );
};
