import { useEffect, useState } from 'react';

import {
    TOKEN_SELECT_SELECTABLE_NETWORKS,
    TradingTradeBuyExchangeType,
} from '@suite-common/trading';
import { Network } from '@suite-common/wallet-config';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';

export type NetworkTab = Network | null;

export function useNetworksTabs() {
    const [activeTab, setActiveTab] = useState<NetworkTab>(null);
    const context = useTradingFormContext<TradingTradeBuyExchangeType>();

    useEffect(() => {
        if (context.network.symbol) {
            setActiveTab(
                TOKEN_SELECT_SELECTABLE_NETWORKS.includes(context.network.symbol)
                    ? context.network
                    : null,
            );
        }
    }, [context.network]);

    return {
        activeTab,
        setActiveTab,
    } as const;
}
