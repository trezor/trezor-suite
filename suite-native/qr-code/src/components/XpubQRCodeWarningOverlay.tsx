import React from 'react';

import { Box, Card, Stack, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const overlayStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    zIndex: 1,
    padding: utils.spacings.medium,
}));

const iconWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    width: 104,
    height: 104,
    backgroundColor: utils.colors.backgroundAlertYellowSubtleOnElevation1,
    padding: utils.spacings.small,
    borderRadius: utils.borders.radii.round,
    borderColor: utils.colors.backgroundAlertYellowSubtleOnElevation0,
    borderWidth: utils.borders.widths.large * 4,
}));

const stackStyle = prepareNativeStyle(_ => ({
    width: '90%',
    alignItems: 'center',
}));

const textAlignCenterStyle = prepareNativeStyle(_ => ({
    textAlign: 'center',
}));

export const XpubOverlayWarning = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Card style={applyStyle(overlayStyle)}>
            <Stack spacing="large" alignItems="center" marginBottom="medium">
                <Box style={applyStyle(iconWrapperStyle)}>
                    <Icon name="warningCircle" size="extraLarge" color="iconAlertYellow" />
                </Box>
                <Stack spacing="small" style={applyStyle(stackStyle)}>
                    <Text variant="titleSmall" style={applyStyle(textAlignCenterStyle)}>
                        Handle your public key (XPUB) with caution
                    </Text>
                    <Text
                        variant="hint"
                        color="textSubdued"
                        style={applyStyle(textAlignCenterStyle)}
                    >
                        Sharing your public key (XPUB) with a third party gives them the ability to
                        view your transaction history.
                    </Text>
                </Stack>
            </Stack>
        </Card>
    );
};
