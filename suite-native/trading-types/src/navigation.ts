import type {
    AppTabsParamList,
    StackToTabCompositeNavigationProp,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';

export type TradingOutputsReviewScreenNavigationProp = StackToTabCompositeNavigationProp<
    TradingStackParamList,
    TradingStackRoutes.TradingSellOutputsReview | TradingStackRoutes.TradingExchangeOutputsReview,
    AppTabsParamList
>;
