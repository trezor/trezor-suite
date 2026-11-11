import { type PropsWithChildren, useCallback, useEffect, useRef } from 'react';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

import {
    YieldFlowExitAnalyticsContext,
    type YieldFlowExitContext,
} from '../../contexts/YieldFlowExitAnalyticsContext';

export const YieldFlowExitAnalyticsProvider = ({ children }: PropsWithChildren) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const navigation = useNavigation();
    const flowRef = useRef<YieldFlowExitContext | null>(null);

    const trackFlow = useCallback((context: YieldFlowExitContext) => {
        // Completion survives session disposal and popToTop refocusing an earlier form.
        if (!flowRef.current?.isCompleted) {
            flowRef.current = context;
        }
    }, []);

    useEffect(
        () =>
            navigation.addListener('beforeRemove', event => {
                const isBackRemoval =
                    event.data.action.type === 'GO_BACK' ||
                    event.data.action.type === 'POP' ||
                    event.data.action.type === 'POP_TO_TOP';
                const flow = flowRef.current;

                if (!isBackRemoval || !flow || flow.isCompleted) return;

                flowRef.current = null;
                analytics.report({
                    type: events.yieldNavigateEvent.name,
                    payload: {
                        action: 'cancel',
                        from: flow.flowType === 'deposit' ? 'deposit-form' : 'withdraw-form',
                        to: 'earn-dashboard',
                        networkSymbol: flow.networkSymbol,
                        vaultId: flow.vaultId,
                    },
                });
            }),
        [analytics, navigation],
    );

    return (
        <YieldFlowExitAnalyticsContext value={trackFlow}>{children}</YieldFlowExitAnalyticsContext>
    );
};
