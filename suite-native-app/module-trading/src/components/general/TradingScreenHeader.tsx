import { useSelector } from 'react-redux';

import { AnimatedBox } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { selectIsAmountInputActive } from '@suite-native/trading-state';

import { TradingTypeAwareContextMessage } from './TradingTypeAwareContextMessage';
import { TRADING_HEADER_ENTERING, TRADING_HEADER_EXITING } from '../../constants';

export const TradingScreenHeader = () => {
    const isAmountInputActive = useSelector(selectIsAmountInputActive);

    if (isAmountInputActive) {
        return null;
    }

    return (
        <AnimatedBox entering={TRADING_HEADER_ENTERING} exiting={TRADING_HEADER_EXITING}>
            <DeviceManagerScreenHeader />
            <TradingTypeAwareContextMessage marginHorizontal="sp16" marginBottom="sp16" />
        </AnimatedBox>
    );
};
