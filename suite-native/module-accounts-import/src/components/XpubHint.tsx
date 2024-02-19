import { KeyboardAvoidingView, Platform } from 'react-native';

import { NetworkType } from '@suite-common/wallet-config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, TextButton } from '@suite-native/atoms';
import { isAddressBasedNetwork } from '@suite-common/wallet-utils';
import { useTranslate } from '@suite-native/intl';

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
    borderTopWidth: utils.borders.widths.small,
    borderTopColor: utils.colors.borderOnElevation0,
}));

export const XpubHint = ({ networkType, handleOpen }: XpubScanHintSheet) => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    const isAddressBased = isAddressBasedNetwork(networkType);
    const buttonTitle = isAddressBased
        ? translate('moduleAccountImport.xpubScanScreen.hintBottomSheet.title.address')
        : translate('moduleAccountImport.xpubScanScreen.hintBottomSheet.title.xpub');

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Box style={applyStyle(sheetTriggerStyle)}>
                <TextButton
                    iconLeft="question"
                    onPress={handleOpen}
                    data-test-id="@accounts-import/sync-coins/xpub-help-link"
                >
                    {buttonTitle}
                </TextButton>
            </Box>
        </KeyboardAvoidingView>
    );
};
