import { Box, Button, ScreenFooterGradient } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useBuyPreviewFlow } from '../../../hooks/buy/useBuyPreviewFlow';

export type BuyPreviewContinueButtonProps = {
    companyName: string;
};

const footerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
}));

export const BuyPreviewContinueButton = ({ companyName }: BuyPreviewContinueButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const { confirmTrade, canProceed, isLoading } = useBuyPreviewFlow();

    return (
        <Box>
            <ScreenFooterGradient />
            <Box style={applyStyle(footerStyle)}>
                <Button
                    onPress={confirmTrade}
                    iconRight="arrowSquareOut"
                    isDisabled={!canProceed}
                    isLoading={isLoading}
                >
                    <Translation
                        id="moduleTrading.tradingBuyPreviewScreen.buyVia"
                        values={{ companyName }}
                    />
                </Button>
            </Box>
        </Box>
    );
};
