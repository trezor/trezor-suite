import { type ReactNode, useState } from 'react';

import { type BuyTrade, type ExchangeTrade, type SellFiatTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { type TradingTradeType, useProviderMetadataChangeEffect } from '@suite-common/trading';
import { Column, GhostContainer, Icon, Row, SkeletonRectangle, Text } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    getProvidersInfoProps,
    isTradingBuyContext,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';

import { getSelectedQuote } from '../TradingForm/TradingFormOffer';
import { TradingOffersModal } from '../TradingOffers/TradingOffersModal';
import { TradingUtilsProvider } from '../TradingUtils/TradingUtilsProvider';

interface TradingReceiveAddressEmptyProps {
    title: ReactNode;
    text: ReactNode;
}

export const TradingReceiveAddressEmpty = ({ title, text }: TradingReceiveAddressEmptyProps) => (
    <Column alignItems="center" gap={4} padding={{ vertical: 16 }}>
        <Text typographyStyle="body-md">{title}</Text>
        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
            {text}
        </Text>
    </Column>
);

export const TradingSelectedOfferProvider = () => {
    const context = useTradingFormContext();
    const { isAmountEmpty, form, type } = context;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const providers = getProvidersInfoProps(context);
    const quote = getSelectedQuote(context);

    const onQuoteSelect = (selected: TradingTradeType) => {
        if (isTradingBuyContext(context)) {
            context.onQuoteSelected(selected as BuyTrade);
        } else if (isTradingSellContext(context)) {
            context.onQuoteSelected(selected as SellFiatTrade);
        } else if (isTradingExchangeContext(context)) {
            context.onQuoteSelected(selected as ExchangeTrade);
        }
    };

    useProviderMetadataChangeEffect(
        type,
        quote == null || isAmountEmpty ? undefined : quote?.exchange,
    );

    const isReceiveAddressSelected =
        (isTradingExchangeContext(context) || isTradingBuyContext(context)) &&
        !!context.tradingReceiveAddress.receiveAddress;

    const shouldHideProvider = isTradingBuyContext(context) && !isReceiveAddressSelected;
    const hasNoQuoteOrAmount = quote == null || isAmountEmpty;

    if (hasNoQuoteOrAmount || shouldHideProvider) {
        return;
    }

    return (
        <>
            <GhostContainer
                onClick={() => setIsModalOpen(true)}
                cursor="pointer"
                data-testid="@trading/selected-offer-provider"
                borderRadius={0}
            >
                <Row alignItems="center" justifyContent="space-between" padding={20}>
                    <Text typographyStyle="body-md">
                        <Translation id="TR_TRADING_PROVIDER" />
                    </Text>
                    <Row gap={16}>
                        {form.state.isFormLoading ? (
                            <SkeletonRectangle animate />
                        ) : (
                            <>
                                <Text typographyStyle="body-md" as="div">
                                    <TradingUtilsProvider
                                        providers={providers}
                                        exchange={quote.exchange}
                                    />
                                </Text>
                                <Icon
                                    name="caretRight"
                                    size={20}
                                    intent="neutral"
                                    priority="secondary"
                                />
                            </>
                        )}
                    </Row>
                </Row>
            </GhostContainer>
            {isModalOpen && (
                <TradingOffersModal
                    onClose={() => setIsModalOpen(false)}
                    onSelect={onQuoteSelect}
                />
            )}
        </>
    );
};
