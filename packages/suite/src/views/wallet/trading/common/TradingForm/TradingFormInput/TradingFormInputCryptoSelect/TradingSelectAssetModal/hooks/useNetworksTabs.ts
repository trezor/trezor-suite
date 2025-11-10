import { useEffect, useMemo, useState } from 'react';

import {
    TOKEN_SELECT_SELECTABLE_NETWORKS,
    TradingTradeBuyExchangeType,
} from '@suite-common/trading';
import { Network } from '@suite-common/wallet-config';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { SelectAssetOptionCurrencyProps } from 'src/types/trading/trading';

export type NetworkTab = Network | null;

export function useNetworksTabs(options: SelectAssetOptionCurrencyProps[]) {
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

    const activeTabOptions = useMemo(() => {
        if (!activeTab) {
            return options;
        }

        return options.filter(
            option =>
                option.coingeckoId === activeTab.coingeckoId && option.symbol === activeTab.symbol,
        );
    }, [activeTab, options]);

    return {
        activeTab,
        setActiveTab,
        activeTabOptions,
    } as const;
}
