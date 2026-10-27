import type {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    StackToStackCompositeScreenProps,
    TradingFlowStackParamList,
    TradingFlowStackRoutes,
} from '@suite-native/navigation';

export type TradingFlowStackNavigationProp<
    T extends keyof TradingFlowStackParamList = keyof TradingFlowStackParamList,
> = StackToStackCompositeNavigationProps<TradingFlowStackParamList, T, RootStackParamList>;

export type TradingFlowStackScreenProps<T extends keyof TradingFlowStackParamList> =
    StackToStackCompositeScreenProps<TradingFlowStackParamList, T, RootStackParamList>;

export type TradingOutputsReviewScreenNavigationProp = TradingFlowStackNavigationProp<
    | TradingFlowStackRoutes.TradingSellTransactionReview
    | TradingFlowStackRoutes.TradingExchangeTransactionReview
>;
