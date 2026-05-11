import { memo } from 'react';
import { Pressable } from 'react-native';
import { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { AnimatedBox, HStack, Text, buttonSizeToDimensionsMap } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { selectIsAmountInputActive } from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useWatchAllTrades } from '../../hooks/general/useWatchAllTrades';

export type HistoryButtonProps = {
    isFormMountedRecently?: boolean;
};

export type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.Trading,
    RootStackParamList
>;

const TRADE_HISTORY_BUTTON_TEST_ID = '@trading/history/button';

const buttonStyle = prepareNativeStyle(utils => ({
    ...buttonSizeToDimensionsMap.large,
    backgroundColor: utils.colors.surfaceFillSunken,
    borderColor: utils.colors.borderNeutral,
    borderWidth: utils.borders.widths.small,
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const HistoryButtonMemoized = memo(({ isFormMountedRecently }: HistoryButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();

    const handleOnPress = () => navigation.navigate(RootStackRoutes.TradingHistory);

    return (
        <AnimatedBox
            entering={isFormMountedRecently ? undefined : FadeInDown}
            exiting={FadeOutDown}
            layout={isFormMountedRecently ? undefined : LinearTransition}
        >
            <Pressable onPress={handleOnPress} testID={TRADE_HISTORY_BUTTON_TEST_ID}>
                <HStack style={applyStyle(buttonStyle)}>
                    <Text variant="body-md" color="contentSecondary">
                        <Translation id="moduleTrading.tradeHistory.button.title" />
                    </Text>
                    <Icon name="caretCircleRight" color="contentSecondary" />
                </HStack>
            </Pressable>
        </AnimatedBox>
    );
});

export const HistoryButton = (props: HistoryButtonProps) => {
    const { totalTrades } = useWatchAllTrades();
    const shouldHideButton = useSelector(selectIsAmountInputActive);

    if (totalTrades === 0 || shouldHideButton) {
        return null;
    }

    return <HistoryButtonMemoized {...props} />;
};
