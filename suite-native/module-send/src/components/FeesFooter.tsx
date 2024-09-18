import { useContext } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Text, Button, Box, Card, HStack, VStack } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { FormContext } from '@suite-native/forms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';

type FeesFooterProps = {
    onSubmit: () => void;
    networkSymbol: NetworkSymbol;
    totalAmount: string;
};

const CARD_BOTTOM_PADDING = 40;

const footerWrapperStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.medium,
}));

const cardStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.small,
    paddingBottom: CARD_BOTTOM_PADDING, // ensures that nothing is hidden behind the absolute confirm button
    backgroundColor: utils.colors.backgroundSurfaceElevationNegative,
    borderColor: utils.colors.borderElevation0,
    borderWidth: utils.borders.widths.small,
    ...utils.boxShadows.none,
}));

const buttonStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    width: '100%',
    // Offset so the button overlaps the adjacent card (as design demands).
    top: -utils.spacings.extraLarge,
}));

export const FeesFooter = ({ onSubmit, totalAmount, networkSymbol }: FeesFooterProps) => {
    const { applyStyle } = useNativeStyles();

    const form = useContext(FormContext);
    const {
        formState: { isSubmitting },
    } = form;

    return (
        <Box style={applyStyle(footerWrapperStyle)}>
            <Card style={applyStyle(cardStyle)}>
                <HStack justifyContent="space-between" alignItems="center">
                    <Text variant="callout">
                        <Translation id="moduleSend.fees.totalAmount" />
                    </Text>
                    <VStack spacing={2} alignItems="flex-end">
                        <CryptoToFiatAmountFormatter
                            variant="callout"
                            color="textDefault"
                            value={totalAmount}
                            network={networkSymbol}
                        />
                        <CryptoAmountFormatter
                            variant="hint"
                            color="textSubdued"
                            value={totalAmount}
                            network={networkSymbol}
                            isBalance={false}
                        />
                    </VStack>
                </HStack>
            </Card>
            <Button
                style={applyStyle(buttonStyle)}
                accessibilityRole="button"
                accessibilityLabel="validate send form"
                testID="@send/fees-submit-button"
                onPress={onSubmit}
                disabled={isSubmitting}
            >
                <Translation id="moduleSend.fees.submitButton" />
            </Button>
        </Box>
    );
};
