import { Box, Button, ScreenFooterGradient } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useBuyPreviewFlow } from '../../../hooks/buy/useBuyPreviewFlow';

export type BuyPreviewContinueButtonProps = {
    companyName: string;
};

const BUY_PREVIEW_CONTINUE_BUTTON_TEST_ID = '@trading/buy-preview/continue-button';

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
                    testID={BUY_PREVIEW_CONTINUE_BUTTON_TEST_ID}
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
