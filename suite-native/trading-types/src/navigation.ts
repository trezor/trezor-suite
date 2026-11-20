import type {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    StackToStackCompositeScreenProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';

export type TradingStackNavigationProp<
    T extends keyof TradingStackParamList = keyof TradingStackParamList,
> = StackToStackCompositeNavigationProps<TradingStackParamList, T, RootStackParamList>;

export type TradingStackScreenProps<T extends keyof TradingStackParamList> =
    StackToStackCompositeScreenProps<TradingStackParamList, T, RootStackParamList>;

export type TradingOutputsReviewScreenNavigationProp = TradingStackNavigationProp<
    | TradingStackRoutes.TradingSellTransactionReview
    | TradingStackRoutes.TradingExchangeTransactionReview
>;
