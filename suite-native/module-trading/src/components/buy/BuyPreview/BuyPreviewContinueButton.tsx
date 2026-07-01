import { Box, Button, ScreenFooterGradient } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type BuyPreviewContinueButtonProps = {
    companyName: string;
};

const footerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
}));

export const BuyPreviewContinueButton = ({ companyName }: BuyPreviewContinueButtonProps) => {
    const { applyStyle } = useNativeStyles();

    const onPress = () => {
        console.warn('BuyPreviewContinueButton onPress is not implemented yet');
    };

    return (
        <Box>
            <ScreenFooterGradient />
            <Box style={applyStyle(footerStyle)}>
                <Button onPress={onPress} iconRight="arrowSquareOut">
                    <Translation
                        id="moduleTrading.tradingBuyPreviewScreen.buyVia"
                        values={{ companyName }}
                    />
                </Button>
            </Box>
        </Box>
    );
};
