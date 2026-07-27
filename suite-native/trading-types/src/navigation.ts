import type {
    AppTabsParamList,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
    StackToTabCompositeNavigationProp,
    TradingStackParamList,
} from '@suite-native/navigation';

export type TradingStackNavigationProp<
    T extends keyof TradingStackParamList = keyof TradingStackParamList,
> = StackToTabCompositeNavigationProp<TradingStackParamList, T, AppTabsParamList>;

export type TradingOutputsReviewScreenNavigationProp = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.TradingSellOutputsReview | RootStackRoutes.TradingExchangeOutputsReview
>;
