import React from 'react';
import { TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';

import { NetworkType } from '@suite-common/wallet-config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';

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
    borderTopWidth: utils.borders.widths.small,
    borderTopColor: utils.colors.borderOnElevation0,
}));

export const XpubHint = ({ networkType, handleOpen }: XpubScanHintSheet) => {
    const { applyStyle } = useNativeStyles();

    const networkAssets = networkToAssetsMap[networkType];
    const { title } = networkAssets ?? defaultAssets;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/*  TODO : Replace with a TextButton atom component when ready. */}
            <TouchableOpacity onPress={handleOpen} style={applyStyle(sheetTriggerStyle)}>
                <Box marginRight="small">
                    <Icon name="question" size="medium" color="iconPrimaryDefault" />
                </Box>
                <Text
                    data-testID="@accounts-import/sync-coins/xpub-help-link"
                    color="textPrimaryDefault"
                >
                    {title}
                </Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};
