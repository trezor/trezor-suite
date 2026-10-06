import type { FiatCurrencyCode } from 'invity-api';

import { Button, HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { FiatCurrencyIcon } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type FiatCurrencyButtonProps = {
    currency?: FiatCurrencyCode;
    onPress: () => void;
    testID?: string;
};

const buttonStyle = prepareNativeStyle(({ spacings }) => ({
    height: spacings.sp40,
}));

export const FiatCurrencyButton = ({ currency, onPress, testID }: FiatCurrencyButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const displayCurrency = (currency ?? '').toUpperCase();
    const tickerTestID = testID ? `${testID}/ticker` : undefined;

    return (
        <Button
            onPress={onPress}
            size="medium"
            intent="neutral"
            priority="secondary"
            iconRight="caretDown"
            shouldWrapChildrenInText={false}
            accessibilityRole="button"
            accessibilityLabel={translate('moduleTrading.selectFiat.buttonTitle')}
            testID={testID}
            style={applyStyle(buttonStyle)}
        >
            <HStack alignItems="center" spacing="sp8">
                <FiatCurrencyIcon size="extraSmall" value={currency} />
                <Text variant="body-sm-strong" color="contentPrimary" testID={tickerTestID}>
                    {displayCurrency}
                </Text>
            </HStack>
        </Button>
    );
};
