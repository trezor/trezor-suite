import { memo } from 'react';
import { Pressable } from 'react-native';
import { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { AnimatedBox, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { selectIsAmountInputActive } from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useWatchAllTrades } from '../../hooks/general/useWatchAllTrades';

export type HistoryButtonProps = {
    isFormMountedRecently?: boolean;
};

export type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.TradingHistory,
    RootStackParamList
>;

const TRADE_HISTORY_BUTTON_TEST_ID = '@trading/history/button';

const buttonStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevationNegative,
    borderColor: utils.colors.borderOnElevationNegative,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.round,
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp8,
    minHeight: 56,
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const HistoryButtonMemoized = memo(({ isFormMountedRecently }: HistoryButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();

    const handleOnPress = () => navigation.navigate(TradingStackRoutes.TradingHistory);

    return (
        <AnimatedBox
            entering={isFormMountedRecently ? undefined : FadeInDown}
            exiting={FadeOutDown}
            layout={isFormMountedRecently ? undefined : LinearTransition}
        >
            <Pressable onPress={handleOnPress} testID={TRADE_HISTORY_BUTTON_TEST_ID}>
                <HStack style={applyStyle(buttonStyle)}>
                    <Text variant="body-md" color="textSubdued">
                        <Translation id="moduleTrading.tradeHistory.button.title" />
                    </Text>
                    <Icon name="caretCircleRight" color="iconSubdued" />
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
