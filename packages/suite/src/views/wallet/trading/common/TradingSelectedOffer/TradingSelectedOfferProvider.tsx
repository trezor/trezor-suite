import { type ComponentType, type ReactNode, useCallback, useState } from 'react';

import { Translation } from '@suite/intl';
import { type TradingType, useProviderMetadataChangeEffect } from '@suite-common/trading';
import { Column, GhostContainer, Icon, Row, Skeleton, Text } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    getProvidersInfoProps,
    isTradingBuyContext,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';

import { TradingOffersModalBuy } from '../TradingOffers/TradingOffersModalBuy';
import { TradingOffersModalExchange } from '../TradingOffers/TradingOffersModalExchange';
import { TradingOffersModalSell } from '../TradingOffers/TradingOffersModalSell';
import { TradingUtilsProvider } from '../TradingUtils/TradingUtilsProvider';
import { useTradingSelectedQuote } from '../hooks/useTradingSelectedQuote';

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

const offersModalComponents: Record<TradingType, ComponentType<{ onClose: () => void }>> = {
    buy: TradingOffersModalBuy,
    sell: TradingOffersModalSell,
    exchange: TradingOffersModalExchange,
};

export const TradingSelectedOfferProvider = () => {
    const context = useTradingFormContext();
    const { isAmountEmpty, form, type } = context;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const providers = getProvidersInfoProps(context);
    const quote = useTradingSelectedQuote(type);

    const OffersModal = offersModalComponents[type];

    const handleModalClose = useCallback(() => setIsModalOpen(false), []);

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
                isDisabled={form.state.isFormLoading}
            >
                <Row alignItems="center" justifyContent="space-between" padding={20}>
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        <Translation id="TR_TRADING_PROVIDER" />
                    </Text>
                    <Row gap={16}>
                        <Row gap={8}>
                            {form.state.isFormLoading ? (
                                <Skeleton animate />
                            ) : (
                                <>
                                    <Text typographyStyle="body-md" as="div">
                                        <TradingUtilsProvider
                                            providers={providers}
                                            exchange={quote.exchange}
                                        />
                                    </Text>
                                    <Icon
                                        as={CaretRightIcon}
                                        size={20}
                                        intent="neutral"
                                        priority="secondary"
                                    />
                                </>
                            )}
                        </Row>
                    </Row>
                </Row>
            </GhostContainer>
            {isModalOpen && <OffersModal onClose={handleModalClose} />}
        </>
    );
};
