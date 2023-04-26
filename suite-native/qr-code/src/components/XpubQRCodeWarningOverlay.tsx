import React from 'react';

import { Card, Pictogram } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const overlayStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    zIndex: 1,
    padding: utils.spacings.medium,
}));

export const XpubOverlayWarning = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Card style={applyStyle(overlayStyle)}>
            <Pictogram
                variant="yellow"
                icon="warningCircleLight"
                title="Handle your public key (XPUB) with caution"
                subtitle="Sharing your public key (XPUB) with a third party gives them the ability to
                        view your transaction history."
            />
        </Card>
    );
};
