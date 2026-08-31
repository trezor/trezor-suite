import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingExchangeFormProps,
    type TradingTradeType,
    selectGroupedTradingExchangeQuotes,
} from '@suite-common/trading';
import { Box, Column, Modal, SubTabs } from '@trezor/components';

import { TradingOffersModalEmpty } from './TradingOffersModalEmpty';
import { TradingOffersModalGroup } from './TradingOffersModalGroup';

type ExchangeTab = 'all' | 'cex' | 'dex';

type TradingOffersModalExchangeProps = {
    onClose: () => void;
};
export const TradingOffersModalExchange = ({ onClose }: TradingOffersModalExchangeProps) => {
    const [activeTab, setActiveTab] = useState<ExchangeTab>('all');
    const { getValues, setValue } = useFormContext<TradingExchangeFormProps>();
    const { fixed, float, dex } = useSelector(selectGroupedTradingExchangeQuotes);

    const handleSelect = useCallback(
        (quote: TradingTradeType) => {
            if (quote.exchange && quote.exchange !== getValues(TRADING_FORM_PROVIDER_SELECT)) {
                setValue(TRADING_FORM_PROVIDER_SELECT, quote.exchange);
            }

            const exchangeType =
                'isDex' in quote && quote.isDex
                    ? TRADING_EXCHANGE_FORM_DEX
                    : TRADING_EXCHANGE_FORM_CEX;

            if (exchangeType !== getValues(TRADING_EXCHANGE_FORM)) {
                setValue(TRADING_EXCHANGE_FORM, exchangeType);
            }

            onClose();
        },
        [getValues, setValue, onClose],
    );

    const showDex = activeTab === 'all' || activeTab === 'dex';
    const showCex = activeTab === 'all' || activeTab === 'cex';
    const isEmpty =
        (activeTab === 'all' && dex.length === 0 && fixed.length === 0 && float.length === 0) ||
        (activeTab === 'dex' && dex.length === 0) ||
        (activeTab === 'cex' && fixed.length === 0 && float.length === 0);

    return (
        <Modal
            onCancel={onClose}
            isBackdropCancelable
            heading={<Translation id="TR_TRADING_SHOW_OFFERS" />}
            data-testid="@trading/offers/modal"
            width={600}
            maxHeight={680}
        >
            <Box padding={{ bottom: 16 }}>
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
                            onSelect={handleSelect}
                        />
                    )}
                    {showCex && float.length > 0 && (
                        <TradingOffersModalGroup
                            title="TR_TRADING_EXCHANGE_FLOAT_OFFERS_HEADING"
                            description="TR_TRADING_FLOATING_RATE_DESCRIPTION"
                            quotes={float}
                            onSelect={handleSelect}
                        />
                    )}
                    {showCex && fixed.length > 0 && (
                        <TradingOffersModalGroup
                            title="TR_TRADING_EXCHANGE_FIXED_OFFERS_HEADING"
                            description="TR_TRADING_FIX_RATE_DESCRIPTION"
                            quotes={fixed}
                            onSelect={handleSelect}
                        />
                    )}
                </Column>
            </Box>
        </Modal>
    );
};
