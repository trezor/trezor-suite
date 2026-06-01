import { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { AnimatedBox } from '@suite-native/atoms';
import { selectIsAmountInputActive } from '@suite-native/trading-state';

import { HeaderTabs } from './HeaderTabs';

export const Header = () => {
    const shouldHideHeader = useSelector(selectIsAmountInputActive);

    if (shouldHideHeader) {
        return null;
    }

    return (
        <AnimatedBox entering={FadeInUp} exiting={FadeOutUp}>
            <HeaderTabs />
        </AnimatedBox>
    );
};
