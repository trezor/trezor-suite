import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';

import { WrappedNativeTokenCompleteContent } from '../../components/earn/WrappedNativeTokenCompleteContent';

type RouteProps = RouteProp<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.WrapNativeTokenComplete
>;

export const WrapNativeTokenCompleteScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, amount } = route.params;

    return (
        <WrappedNativeTokenCompleteContent
            accountKey={accountKey}
            amount={amount}
            flowType="wrap"
        />
    );
};
