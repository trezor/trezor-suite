import { useCallback } from 'react';

import { events } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { type ActiveView } from '@suite-native/atoms';
import { useServices } from '@trezor/dependency-injection';

type UseYieldCurrencyToggleAnalyticsParams = {
    networkSymbol: NetworkSymbol | undefined;
    vaultId?: string;
};

/**
 * Reports the crypto/fiat switch of a yield amount input. Standalone wrap/unwrap forms have no
 * vault, so they report without `vaultId`.
 */
export const useYieldCurrencyToggleAnalytics = ({
    networkSymbol,
    vaultId,
}: UseYieldCurrencyToggleAnalyticsParams) => {
    const { analytics } = useServices(injectNativeAnalytics);

    return useCallback(
        (activeView: ActiveView) => {
            analytics.report({
                type: events.yieldInteractionEvent.name,
                payload: {
                    element: 'amount-currency-toggle',
                    value: activeView === 'secondary' ? 'fiat' : 'crypto',
                    networkSymbol,
                    vaultId,
                },
            });
        },
        [analytics, networkSymbol, vaultId],
    );
};
