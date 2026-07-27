import { Box, Button, ScreenFooterGradient } from '@suite-native/atoms';
import { Translation, type TxKeyPath, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const footerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillPage,
}));

type YieldClaimFlowFooterProps = {
    buttonTranslationId?: TxKeyPath;
    isDisabled: boolean;
    isLoading?: boolean;
    onPress: () => void;
};

export const YieldClaimFlowFooter = ({
    buttonTranslationId = 'generic.buttons.continue',
    isDisabled,
    isLoading = false,
    onPress,
}: YieldClaimFlowFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    return (
        <>
            <ScreenFooterGradient />
            <Box style={applyStyle(footerStyle)}>
                <Button
                    accessibilityRole="button"
                    accessibilityLabel={translate(buttonTranslationId)}
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                    onPress={onPress}
                >
                    <Translation id={buttonTranslationId} />
                </Button>
            </Box>
        </>
    );
};
