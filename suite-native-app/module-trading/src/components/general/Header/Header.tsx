import { useSelector } from 'react-redux';

import { AnimatedBox } from '@suite-native/atoms';
import { selectIsAmountInputActive } from '@suite-native/trading-state';

import { HeaderTabs } from './HeaderTabs';
import { TRADING_HEADER_ENTERING, TRADING_HEADER_EXITING } from '../../../constants';

export const Header = () => {
    const shouldHideHeader = useSelector(selectIsAmountInputActive);

    if (shouldHideHeader) {
        return null;
    }

    return (
        <AnimatedBox entering={TRADING_HEADER_ENTERING} exiting={TRADING_HEADER_EXITING}>
            <HeaderTabs />
        </AnimatedBox>
    );
};
