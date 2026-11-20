import { Platform } from 'react-native';
import {
    FadeInUp,
    FadeOutUp,
    LinearTransition,
    StretchInY,
    StretchOutY,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { selectTradingExchangeIsLoading } from '@suite-common/trading';
import { AnimatedBox, Card } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';

import { ExchangeRateAndProviderPicker } from './ExchangeRateAndProviderPicker';
import { ExchangeReceiveAccountPicker } from './receive/ExchangeReceiveAccountPicker';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';

const cardEnteringAnimation = Platform.OS === 'android' ? StretchInY : FadeInUp;
const cardExitingAnimation = Platform.OS === 'android' ? StretchOutY : FadeOutUp;

export const ExchangePickersCard = () => {
    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const { control } = useExchangeFormContext();

    const receiveAsset = useWatch({ name: 'receiveAsset', control });
    const quote = useWatch({ name: 'quote', control });

    const selectedSymbol = getSymbolFromTradeableAsset(receiveAsset);
    const isReceiveAccountPickerVisible = selectedSymbol !== undefined;
    const isRateAndProviderPickerVisible = quote !== undefined || isLoading;

    if (!isReceiveAccountPickerVisible && !isRateAndProviderPickerVisible) {
        return null;
    }

    return (
        <AnimatedBox
            layout={LinearTransition}
            entering={cardEnteringAnimation}
            exiting={cardExitingAnimation}
        >
            <Card noPadding>
                <ExchangeReceiveAccountPicker />
                <ExchangeRateAndProviderPicker />
            </Card>
        </AnimatedBox>
    );
};
