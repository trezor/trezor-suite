import { useCallback } from 'react';
import { useSelector, useStore } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { type DiscoveryRootState, selectDiscoveryByDevicePath } from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';

export const useHandlePassphraseFlowDone = () => {
    const device = useSelector(selectSelectedDevice);
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const store = useStore();

    const onPassphraseFlowDone = useCallback(() => {
        const discovery = selectDiscoveryByDevicePath(
            store.getState() as DiscoveryRootState,
            device?.path,
        );
        if (discovery) {
            analytics.report({
                type: events.passphraseFlowFinishedEvent.name,
                payload: { isEmptyWallet: !discovery.hasLoadedAnyNonEmptyAccount },
            });
        }
    }, [analytics, device?.path, store]);

    return onPassphraseFlowDone;
};
