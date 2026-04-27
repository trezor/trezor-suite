import { useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { type TradingTradeType, selectGroupedTradingExchangeQuotes } from '@suite-common/trading';
import { Column, SubTabs } from '@trezor/components';

import { TradingOffersModalEmpty } from './TradingOffersModalEmpty';
import { TradingOffersModalGroup } from './TradingOffersModalGroup';

type ExchangeTab = 'all' | 'cex' | 'dex';

type TradingOffersModalExchangeProps = {
    onSelect: (quote: TradingTradeType) => void;
};
export const TradingOffersModalExchange = ({ onSelect }: TradingOffersModalExchangeProps) => {
    const [activeTab, setActiveTab] = useState<ExchangeTab>('all');

    const { fixed, float, dex } = useSelector(selectGroupedTradingExchangeQuotes);

    const showDex = activeTab === 'all' || activeTab === 'dex';
    const showCex = activeTab === 'all' || activeTab === 'cex';
    const isEmpty =
        (activeTab === 'all' && dex.length === 0 && fixed.length === 0 && float.length === 0) ||
        (activeTab === 'dex' && dex.length === 0) ||
        (activeTab === 'cex' && fixed.length === 0 && float.length === 0);

    return (
        <Column gap={24} height="100%">
            <SubTabs activeItemId={activeTab}>
                <SubTabs.Item id="all" onClick={() => setActiveTab('all')}>
                    <Translation id="TR_ALL" />
                </SubTabs.Item>
                <SubTabs.Item id="cex" onClick={() => setActiveTab('cex')}>
                    <Translation id="TR_EXCHANGE_CEX" />
                </SubTabs.Item>
                <SubTabs.Item id="dex" onClick={() => setActiveTab('dex')}>
                    <Translation id="TR_EXCHANGE_DEX" />
                </SubTabs.Item>
            </SubTabs>
            {isEmpty && <TradingOffersModalEmpty />}
            {showDex && dex.length > 0 && (
                <TradingOffersModalGroup
                    title="TR_TRADING_EXCHANGE_DEX_OFFERS_HEADING"
                    description="TR_TRADING_EXCHANGE_DEX_OFFERS_HEADING_TOOLTIP"
                    quotes={dex}
                    onSelect={onSelect}
                />
            )}
            {showCex && float.length > 0 && (
                <TradingOffersModalGroup
                    title="TR_TRADING_EXCHANGE_FLOAT_OFFERS_HEADING"
                    description="TR_TRADING_FLOATING_RATE_DESCRIPTION"
                    quotes={float}
                    onSelect={onSelect}
                />
            )}
            {showCex && fixed.length > 0 && (
                <TradingOffersModalGroup
                    title="TR_TRADING_EXCHANGE_FIXED_OFFERS_HEADING"
                    description="TR_TRADING_FIX_RATE_DESCRIPTION"
                    quotes={fixed}
                    onSelect={onSelect}
                />
            )}
        </Column>
    );
};
