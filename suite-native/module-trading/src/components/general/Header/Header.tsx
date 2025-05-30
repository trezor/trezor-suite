import { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { AnimatedBox, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { HeaderTabs } from './HeaderTabs';
import {
    selectIsAmountInputActive,
    selectIsTradingBuyEnabled,
    selectIsTradingEnabled,
    selectIsTradingExchangeEnabled,
    selectIsTradingSellEnabled,
} from '../../../selectors/commonSelectors';

export type HeaderProps = {
    isFormMountedRecently?: boolean;
};

export const Header = ({ isFormMountedRecently }: HeaderProps) => {
    const isTradingEnabled = useSelector(selectIsTradingEnabled);
    const isBuyEnabled = useSelector(selectIsTradingBuyEnabled);
    const isExchangeEnabled = useSelector(selectIsTradingExchangeEnabled);
    const isSellEnabled = useSelector(selectIsTradingSellEnabled);
    const shouldHideHeader = useSelector(selectIsAmountInputActive);

    if (!isTradingEnabled || shouldHideHeader) {
        return null;
    }

    const shouldDisplayDeprecatedBuyHeader = isBuyEnabled && !isExchangeEnabled && !isSellEnabled;
    const padding = shouldDisplayDeprecatedBuyHeader ? 'sp16' : undefined;

    return (
        <AnimatedBox
            paddingHorizontal={padding}
            paddingTop={padding}
            entering={isFormMountedRecently ? undefined : FadeInUp}
            exiting={FadeOutUp}
        >
            {shouldDisplayDeprecatedBuyHeader ? (
                <Text variant="titleSmall" color="textDefault">
                    <Translation id="moduleTrading.tradingScreen.buyTitle" />
                </Text>
            ) : (
                <HeaderTabs />
            )}
        </AnimatedBox>
    );
};
