import { Box, Button, ScreenFooterGradient } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useSellPreviewFlow } from '../../../hooks/sell/useSellPreviewFlow';

export type SellPreviewContinueButtonProps = {
    companyName: string;
};

const SELL_PREVIEW_CONTINUE_BUTTON_TEST_ID = '@trading/sell-preview/continue-button';

const footerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
}));

export const SellPreviewContinueButton = ({ companyName }: SellPreviewContinueButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const { canProceed, isLoading, continueToProvider } = useSellPreviewFlow();

    return (
        <Box>
            <ScreenFooterGradient />
            <Box style={applyStyle(footerStyle)}>
                <Button
                    onPress={continueToProvider}
                    iconRight="arrowSquareOut"
                    isDisabled={!canProceed}
                    isLoading={isLoading}
                    testID={SELL_PREVIEW_CONTINUE_BUTTON_TEST_ID}
                >
                    <Translation
                        id="moduleTrading.tradingSellPreviewScreen.sellVia"
                        values={{ companyName }}
                    />
                </Button>
            </Box>
        </Box>
    );
};
