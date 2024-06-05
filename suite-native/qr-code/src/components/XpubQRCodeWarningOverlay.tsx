import { Box, PictogramTitleHeader } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const overlayStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    padding: utils.spacings.medium,
}));

export const XpubOverlayWarning = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(overlayStyle)}>
            <PictogramTitleHeader
                variant="yellow"
                icon="warningCircleLight"
                title="Handle your public key (XPUB) with caution"
                subtitle="Sharing your public key (XPUB) with a third party gives them the ability to
                        view your transaction history."
            />
        </Box>
    );
};
