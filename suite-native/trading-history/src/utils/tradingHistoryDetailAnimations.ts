import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

const TRADING_HISTORY_DETAIL_ANIMATION_DURATION = 250;

export const tradingHistoryDetailLayoutTransition = LinearTransition.duration(
    TRADING_HISTORY_DETAIL_ANIMATION_DURATION,
);
export const tradingHistoryDetailEnteringTransition = FadeIn.duration(
    TRADING_HISTORY_DETAIL_ANIMATION_DURATION,
);
export const tradingHistoryDetailExitingTransition = FadeOut.duration(
    TRADING_HISTORY_DETAIL_ANIMATION_DURATION,
);
