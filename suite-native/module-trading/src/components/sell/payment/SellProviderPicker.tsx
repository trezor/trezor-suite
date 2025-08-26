import { StretchInY, StretchOutY } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { SellFiatTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    TradingRootState as TradingRootStateCommon,
    selectTradingProviderByNameAndTradeType,
    selectTradingSellIsLoading,
    selectTradingSellProviders,
} from '@suite-common/trading';
import { AnimatedBox, HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { TradingRootState } from '../../../reducers';
import { selectSellQuotesByPaymentMethod } from '../../../selectors/sellSelectors';
import { OverviewRow } from '../../general/OverviewRow';
import { OverviewValueSkeleton } from '../../general/OverviewValueSkeleton';
import { ProviderLogo } from '../../general/ProviderLogo';

const PROVIDER_PICKER_TEST_ID = '@trading/sell/provider-picker';

type SellProviderPickerRightProps = {
    isLoading: boolean;
    selectedValue: SellFiatTrade | undefined;
};

const pickerStyle = prepareNativeStyle(({ borders, colors }) => ({
    borderTopWidth: borders.widths.small,
    borderTopColor: colors.backgroundSurfaceElevation0,
}));

const SellProviderPickerRight = ({ isLoading, selectedValue }: SellProviderPickerRightProps) => {
    const { translate } = useTranslate();
    const { exchange } = selectedValue ?? {};

    const provider = useSelector((state: TradingRootStateCommon) =>
        selectTradingProviderByNameAndTradeType(state, exchange, 'sell'),
    );

    if (isLoading) {
        return <OverviewValueSkeleton />;
    }

    invariant(provider, 'Selected provider should be defined');
    const { companyName, logo } = provider;

    return (
        <HStack>
            <ProviderLogo logo={logo} />
            <Text
                color="textSubdued"
                variant="body"
                accessibilityLabel={translate('moduleTrading.tradingScreen.selectedProvider')}
                testID={PROVIDER_PICKER_TEST_ID + '/value'}
            >
                {companyName}
            </Text>
        </HStack>
    );
};

export const SellProviderPicker = () => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const form = useSellFormContext();
    const providers = useSelector(selectTradingSellProviders);
    const isLoading = useSelector(selectTradingSellIsLoading);

    const quote = form.getValues('quote');
    const quotes = useSelector((state: TradingRootState) =>
        selectSellQuotesByPaymentMethod(state, quote?.paymentMethod),
    ).fixed;

    const shouldShowPicker = (providers && quotes.length > 0) || isLoading;

    if (!shouldShowPicker) {
        return null;
    }

    return (
        <AnimatedBox style={applyStyle(pickerStyle)} entering={StretchInY} exiting={StretchOutY}>
            <OverviewRow
                title={translate('moduleTrading.tradingScreen.provider')}
                noCaret={isLoading}
                testID={PROVIDER_PICKER_TEST_ID}
                warning={
                    isLoading ? undefined : translate('moduleTrading.tradingScreen.kycWarning')
                }
                noBottomBorder
            >
                <SellProviderPickerRight isLoading={isLoading} selectedValue={quote} />
            </OverviewRow>
        </AnimatedBox>
    );
};
