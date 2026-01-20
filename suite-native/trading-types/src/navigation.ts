import type {
    AppTabsParamList,
    StackToTabCompositeNavigationProp,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';

export type TradingStackNavigationProp<
    T extends keyof TradingStackParamList = keyof TradingStackParamList,
> = StackToTabCompositeNavigationProp<TradingStackParamList, T, AppTabsParamList>;

export type TradingOutputsReviewScreenNavigationProp = TradingStackNavigationProp<
    TradingStackRoutes.TradingSellOutputsReview | TradingStackRoutes.TradingExchangeOutputsReview
>;
