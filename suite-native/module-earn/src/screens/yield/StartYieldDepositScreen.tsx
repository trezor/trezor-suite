import { useEffect, useRef } from 'react';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { type ResolvedYieldFlowData } from '@suite-common/wallet-core';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { type YieldStackParamList, type YieldStackRoutes } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

import { EarnLoadingScreen } from '../../components/earn/EarnLoadingScreen';
import { useStartYieldDepositFlow } from '../../hooks/yield/useStartYieldDepositFlow';

type StartYieldDepositScreenProps = {
    yieldFlowData: ResolvedYieldFlowData;
};

export const StartYieldDepositScreen = ({ yieldFlowData }: StartYieldDepositScreenProps) => {
    const route = useRoute<RouteProp<YieldStackParamList, YieldStackRoutes.HowYieldWorks>>();
    const { flowData, flowKey, account, vault } = yieldFlowData;
    const { analytics } = useServices(injectNativeAnalytics);
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

        void handleStartYieldDepositFlow().then(destination => {
            if (!destination) return;

            analytics.report({
                type: events.yieldNavigateEvent.name,
                payload: {
                    action: 'continue',
                    from: 'deposit-in-a-nutshell-modal',
                    to: destination,
                    networkSymbol: account?.symbol,
                    vaultId: vault?.id,
                },
            });
        });
    }, [flowData, flowKey, handleStartYieldDepositFlow, analytics, account?.symbol, vault?.id]);

    return <EarnLoadingScreen />;
};
