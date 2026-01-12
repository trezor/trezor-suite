import { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { AnimatedBox } from '@suite-native/atoms';
import { selectIsAmountInputActive } from '@suite-native/trading-state';

import { HeaderTabs } from './HeaderTabs';

export type HeaderProps = {
    isFormMountedRecently?: boolean;
};

export const Header = ({ isFormMountedRecently }: HeaderProps) => {
    const shouldHideHeader = useSelector(selectIsAmountInputActive);

    if (shouldHideHeader) {
        return null;
    }

    return (
        <AnimatedBox entering={isFormMountedRecently ? undefined : FadeInUp} exiting={FadeOutUp}>
            <HeaderTabs />
        </AnimatedBox>
    );
};
