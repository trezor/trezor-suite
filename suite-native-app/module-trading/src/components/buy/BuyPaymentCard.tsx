import { Platform } from 'react-native';
import { FadeIn, FadeInDown, FadeOutUp, StretchInY, StretchOutY } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { AnimatedBox, Card, useBottomSheetControls } from '@suite-native/atoms';
import { CountrySubdivisionPickerControlsContext } from '@suite-native/trading-residence';
import { selectBuyBestQuotesForAvailablePaymentMethods } from '@suite-native/trading-state';

import { BuyPaymentMethodPicker } from './BuyPaymentMethodPicker';
import { BuyProviderPicker } from './BuyProviderPicker';
import { BuyReceiveAccountPicker } from './BuyReceiveAccountPicker';
import { TradingCountrySubdivisionPickerButton } from '../general/TradingCountrySubdivisionPickerButton';
import { TradingLocationPickers } from '../general/TradingLocationPickers';

export type PaymentCardProps = {
    isFormMountedRecently?: boolean;
    shouldAnimateEntering?: boolean;
};

const getEnteringAnimation = (isFormMountedRecently?: boolean, shouldAnimateEntering?: boolean) => {
    // on android fade animation looks ugly on view with shadows, better to skip the initial one
    // and use stretch animation instead for the rest of the time
    if (Platform.OS === 'android') {
        return isFormMountedRecently ? undefined : StretchInY;
    }

    if (isFormMountedRecently) {
        return shouldAnimateEntering ? FadeIn : undefined;
    }

    return FadeInDown;
};

// on android fade animation looks ugly on view with shadows, better to use stretch one here
const getExitingAnimation = () => (Platform.OS === 'android' ? StretchOutY : FadeOutUp);

export const BuyPaymentCard = ({
    isFormMountedRecently,
    shouldAnimateEntering,
}: PaymentCardProps) => {
    const subdivisionPickerControls = useBottomSheetControls();

    const enteringAnimation = getEnteringAnimation(isFormMountedRecently, shouldAnimateEntering);
    const exitingAnimation = getExitingAnimation();

    const quotes = useSelector(selectBuyBestQuotesForAvailablePaymentMethods);
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const noCountryBottomBorder = quotes.length === 0 && !isLoading;

    return (
        <CountrySubdivisionPickerControlsContext value={subdivisionPickerControls}>
            <AnimatedBox entering={enteringAnimation} exiting={exitingAnimation}>
                <Card noPadding>
                    <BuyReceiveAccountPicker />
                    <TradingLocationPickers context="buy" noBottomBorder={noCountryBottomBorder} />
                    <BuyPaymentMethodPicker />
                    <BuyProviderPicker />
                </Card>
            </AnimatedBox>
            <TradingCountrySubdivisionPickerButton testID="@trading/buy/country-subdivision-button" />
        </CountrySubdivisionPickerControlsContext>
    );
};
