import { useEffect, useRef } from 'react';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type ResolvedYieldFlowData } from '@suite-common/wallet-core';
import { type YieldStackParamList, type YieldStackRoutes } from '@suite-native/navigation';

import { EarnLoadingScreen } from '../../components/earn/EarnLoadingScreen';
import { useStartYieldDepositFlow } from '../../hooks/yield/useStartYieldDepositFlow';

type StartYieldDepositScreenProps = {
    yieldFlowData: ResolvedYieldFlowData;
};

export const StartYieldDepositScreen = ({ yieldFlowData }: StartYieldDepositScreenProps) => {
    const route = useRoute<RouteProp<YieldStackParamList, YieldStackRoutes.HowYieldWorks>>();
    const { flowData, flowKey } = yieldFlowData;
    const { handleStartYieldDepositFlow } = useStartYieldDepositFlow({
        flowData,
        flowKey,
        routeParams: route.params,
        shouldReplaceRoute: true,
    });

    const hasStarted = useRef(false);

    useEffect(() => {
        if (!flowData || !flowKey || hasStarted.current) return;
        hasStarted.current = true;

        void handleStartYieldDepositFlow();
    }, [flowData, flowKey, handleStartYieldDepositFlow]);

    return <EarnLoadingScreen />;
};
