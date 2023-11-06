import { KeyboardAvoidingView, Platform } from 'react-native';

import { NetworkType } from '@suite-common/wallet-config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, TextButton } from '@suite-native/atoms';

import { defaultAssets, networkToAssetsMap } from './XpubHintBottomSheet';

type XpubScanHintSheet = {
    networkType: NetworkType;
    handleOpen: () => void;
};

const sheetTriggerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: utils.spacings.large,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    borderTopWidth: utils.borders.widths.s,
    borderTopColor: utils.colors.borderOnElevation0,
}));

export const XpubHint = ({ networkType, handleOpen }: XpubScanHintSheet) => {
    const { applyStyle } = useNativeStyles();

    const networkAssets = networkToAssetsMap[networkType];
    const { title } = networkAssets ?? defaultAssets;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Box style={applyStyle(sheetTriggerStyle)}>
                <TextButton
                    iconLeft="question"
                    onPress={handleOpen}
                    data-testID="@accounts-import/sync-coins/xpub-help-link"
                >
                    {title}
                </TextButton>
            </Box>
        </KeyboardAvoidingView>
    );
};
