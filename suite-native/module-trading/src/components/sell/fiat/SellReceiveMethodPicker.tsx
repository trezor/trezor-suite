import { StretchInY, StretchOutY } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { SellFiatTrade } from 'invity-api';

import { selectTradingSellIsLoading } from '@suite-common/trading';
import { AnimatedBox, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { selectSellBestQuotesForAvailablePaymentMethods } from '../../../selectors/sellSelectors';
import { OverviewRow } from '../../general/OverviewRow';
import { OverviewValueSkeleton } from '../../general/OverviewValueSkeleton';

const RECEIVE_METHOD_PICKER_TEST_ID = '@trading/sell/receive-method-picker';

type SellReceiveMethodPickerRightProps = {
    isLoading: boolean;
    selectedValue: SellFiatTrade | undefined;
};

const pickerStyle = prepareNativeStyle(({ borders, colors }) => ({
    borderTopWidth: borders.widths.small,
    borderTopColor: colors.backgroundSurfaceElevation0,
}));

const SellReceiveMethodPickerRight = ({
    isLoading,
    selectedValue,
}: SellReceiveMethodPickerRightProps) => {
    const { translate } = useTranslate();

    if (isLoading) {
        return <OverviewValueSkeleton />;
    }

    if (selectedValue) {
        return (
            <Text
                color="textSubdued"
                variant="body"
                accessibilityLabel={translate('moduleTrading.tradingScreen.selectedReceiveMethod')}
                testID={RECEIVE_METHOD_PICKER_TEST_ID + '/value'}
            >
                {selectedValue.paymentMethodName}
            </Text>
        );
    }

    return (
        <Text
            color="textSubdued"
            variant="body"
            accessibilityLabel={translate('moduleTrading.tradingScreen.noReceiveMethod')}
            testID={RECEIVE_METHOD_PICKER_TEST_ID + '/value'}
        >
            {translate('moduleTrading.notSelected')}
        </Text>
    );
};

export const SellReceiveMethodPicker = () => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const form = useSellFormContext();
    const quotes = useSelector(selectSellBestQuotesForAvailablePaymentMethods);
    const quote = form.getValues('quote');
    const isLoading = useSelector(selectTradingSellIsLoading);

    const shouldShowPicker = quotes.length > 0 || isLoading;

    if (!shouldShowPicker) {
        return null;
    }

    return (
        <AnimatedBox style={applyStyle(pickerStyle)} entering={StretchInY} exiting={StretchOutY}>
            <OverviewRow
                title={translate('moduleTrading.tradingScreen.receiveMethod')}
                noCaret={isLoading}
                testID={RECEIVE_METHOD_PICKER_TEST_ID}
                noBottomBorder
            >
                <SellReceiveMethodPickerRight isLoading={isLoading} selectedValue={quote} />
            </OverviewRow>
        </AnimatedBox>
    );
};
