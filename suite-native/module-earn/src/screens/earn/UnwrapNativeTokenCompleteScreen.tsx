import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';

import { WrappedNativeTokenCompleteContent } from '../../components/earn/WrappedNativeTokenCompleteContent';

type RouteProps = RouteProp<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.UnwrapNativeTokenComplete
>;

export const UnwrapNativeTokenCompleteScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, amount } = route.params;

    return (
        <WrappedNativeTokenCompleteContent
            accountKey={accountKey}
            amount={amount}
            flowType="unwrap"
        />
    );
};
