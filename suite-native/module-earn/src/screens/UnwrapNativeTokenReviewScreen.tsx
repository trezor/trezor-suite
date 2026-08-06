import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';

import { StandaloneWrappedNativeReview } from '../components/StandaloneWrappedNativeReview';

type RouteProps = RouteProp<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.UnwrapNativeTokenReview
>;

export const UnwrapNativeTokenReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, amount, unsignedTransaction } = route.params;

    return (
        <StandaloneWrappedNativeReview
            accountKey={accountKey}
            amount={amount}
            flowType="unwrap"
            unsignedTransaction={unsignedTransaction}
        />
    );
};
