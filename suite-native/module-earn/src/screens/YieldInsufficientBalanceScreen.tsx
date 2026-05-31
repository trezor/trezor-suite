import { type RouteProp, useRoute } from '@react-navigation/native';

import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    ScreenHeader,
} from '@suite-native/navigation';

import { EarnInsufficientBalanceContent } from '../components/EarnInsufficientBalanceContent';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.YieldInsufficientBalance>;

export const YieldInsufficientBalanceScreen = () => {
    const route = useRoute<RouteProps>();
    const { resolutionStatus, tokenSymbol } = useResolvedYieldFlowData(route.params);

    if (resolutionStatus !== 'resolved') {
        return null;
    }

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <EarnInsufficientBalanceContent
                title={
                    <Translation
                        id="earn.yieldInsufficientBalance.title"
                        values={{ tokenSymbol }}
                    />
                }
                subtitle={
                    <Translation
                        id="earn.yieldInsufficientBalance.subtitle"
                        values={{ tokenSymbol }}
                    />
                }
                primaryButtonContent={
                    <Translation
                        id="earn.yieldInsufficientBalance.getButton"
                        values={{ tokenSymbol }}
                    />
                }
            />
        </Screen>
    );
};
