import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingExchangeFormProps,
    type TradingTradeType,
    selectGroupedExchangeQuotes,
} from '@suite-common/trading';
import { Box, Column, Modal, SubTabs } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';

import { TradingOffersModalEmpty } from './TradingOffersModalEmpty';
import { TradingOffersModalGroup } from './TradingOffersModalGroup';

type ExchangeProviderFilter = 'all' | 'cex' | 'dex';

const filterByProviderType = (
    quotes: ExchangeTrade[],
    filter: ExchangeProviderFilter,
): ExchangeTrade[] => {
    switch (filter) {
        case 'all':
            return quotes;
        case 'cex':
            return quotes.filter(quote => !quote.isDex);
        case 'dex':
            return quotes.filter(quote => quote.isDex);
        default:
            return exhaustive(filter);
    }
};

type TradingOffersModalExchangeProps = {
    onClose: () => void;
};
export const TradingOffersModalExchange = ({ onClose }: TradingOffersModalExchangeProps) => {
    const [activeFilter, setActiveFilter] = useState<ExchangeProviderFilter>('all');
    const { getValues, setValue } = useFormContext<TradingExchangeFormProps>();
    const { fixed, float } = useSelector(selectGroupedExchangeQuotes);

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

    const hasNoQuotes = fixed.length === 0 && float.length === 0;

    return (
        <Modal
            onCancel={onClose}
            isBackdropCancelable
            heading={<Translation id="TR_TRADING_PROVIDERS" />}
            data-testid="@trading/offers/modal"
            width={600}
            maxHeight={680}
        >
            <Box padding={{ bottom: 16 }}>
                <Column gap={24} height="100%">
                    <SubTabs activeItemId={activeFilter}>
                        <SubTabs.Item
                            id="all"
                            onClick={() => setActiveFilter('all')}
                            data-testid="@trading/offers/filter/all"
                        >
                            <Translation id="TR_TRADING_PROVIDER_FILTER_ALL" />
                        </SubTabs.Item>
                        <SubTabs.Item
                            id="cex"
                            onClick={() => setActiveFilter('cex')}
                            data-testid="@trading/offers/filter/cex"
                        >
                            <Translation id="TR_TRADING_PROVIDER_FILTER_CENTRALIZED" />
                        </SubTabs.Item>
                        <SubTabs.Item
                            id="dex"
                            onClick={() => setActiveFilter('dex')}
                            data-testid="@trading/offers/filter/dex"
                        >
                            <Translation id="TR_TRADING_PROVIDER_FILTER_DECENTRALIZED" />
                        </SubTabs.Item>
                    </SubTabs>
                    {hasNoQuotes ? (
                        <TradingOffersModalEmpty />
                    ) : (
                        <>
                            <TradingOffersModalGroup
                                title="TR_TRADING_EXCHANGE_FLOAT_OFFERS_HEADING"
                                description="TR_TRADING_FLOATING_RATE_DESCRIPTION"
                                quotes={filterByProviderType(float, activeFilter)}
                                onSelect={handleSelect}
                            />
                            <TradingOffersModalGroup
                                title="TR_TRADING_EXCHANGE_FIXED_OFFERS_HEADING"
                                description="TR_TRADING_FIX_RATE_DESCRIPTION"
                                quotes={filterByProviderType(fixed, activeFilter)}
                                onSelect={handleSelect}
                            />
                        </>
                    )}
                </Column>
            </Box>
        </Modal>
    );
};
