import { Platform } from 'react-native';
import { FadeIn, FadeInDown, FadeOutUp, StretchInY, StretchOutY } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { selectTradingSellIsLoading } from '@suite-common/trading';
import { AnimatedBox, Card } from '@suite-native/atoms';
import { useBottomSheetControls } from '@suite-native/trading-atoms';
import { CountrySubdivisionPickerControlsContext } from '@suite-native/trading-residence';
import { selectSellBestQuotesForAvailablePaymentMethods } from '@suite-native/trading-state';

import { SellProviderPicker } from './SellProviderPicker';
import { TradingCountrySubdivisionPickerButton } from '../../general/TradingCountrySubdivisionPickerButton';
import { TradingLocationPickers } from '../../general/TradingLocationPickers';
import { SellReceiveMethodPicker } from '../fiat/SellReceiveMethodPicker';

export type SellPaymentCardProps = {
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

export const SellPaymentCard = ({
    shouldAnimateEntering,
    isFormMountedRecently,
}: SellPaymentCardProps) => {
    const subdivisionPickerControls = useBottomSheetControls();

    const enteringAnimation = getEnteringAnimation(isFormMountedRecently, shouldAnimateEntering);
    const exitingAnimation = getExitingAnimation();

    const quotes = useSelector(selectSellBestQuotesForAvailablePaymentMethods);
    const isLoading = useSelector(selectTradingSellIsLoading);
    const noCountryBottomBorder = quotes.length === 0 && !isLoading;

    return (
        <CountrySubdivisionPickerControlsContext value={subdivisionPickerControls}>
            <AnimatedBox entering={enteringAnimation} exiting={exitingAnimation}>
                <Card noPadding>
                    <TradingLocationPickers context="sell" noBottomBorder={noCountryBottomBorder} />
                    <SellReceiveMethodPicker />
                    <SellProviderPicker />
                </Card>
            </AnimatedBox>
            <TradingCountrySubdivisionPickerButton testID="@trading/sell/country-subdivision-button" />
        </CountrySubdivisionPickerControlsContext>
    );
};
