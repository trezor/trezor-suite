import { ReactNode } from 'react';

import { Column, Divider, Icon, Row, SkeletonRectangle, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    getProvidersInfoProps,
    isTradingBuyContext,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';

import { getSelectedQuote } from '../TradingForm/TradingFormOffer';
import { TradingUtilsProvider } from '../TradingUtils/TradingUtilsProvider';

interface TradingReceiveAddressEmptyProps {
    title: ReactNode;
    text: ReactNode;
}

export const TradingReceiveAddressEmpty = ({ title, text }: TradingReceiveAddressEmptyProps) => (
    <Column alignItems="center" gap={spacings.xxs} padding={{ vertical: spacings.md }}>
        <Text typographyStyle="body">{title}</Text>
        <Text typographyStyle="hint" variant="tertiary">
            {text}
        </Text>
    </Column>
);

export const TradingSelectedOfferProvider = () => {
    const context = useTradingFormContext();
    const { quotes, preselectedQuote, isAmountEmpty, form, type, goToOffers } = context;

    const providers = getProvidersInfoProps(context);
    const bestScoredQuote = quotes?.[0];
    const quote = preselectedQuote ?? getSelectedQuote(context, bestScoredQuote);

    const onGoToOffers = async () => {
        await goToOffers();
    };

    const needsReceiveAddress = type !== 'sell';
    const isReceiveAddressSelected =
        (isTradingExchangeContext(context) || isTradingBuyContext(context)) &&
        !!context.tradingReceiveAddress.receiveAddress;

    if (quote == null || isAmountEmpty || (needsReceiveAddress && !isReceiveAddressSelected)) {
        return;
    }

    return (
        <Column cursor="pointer">
            <Divider margin={0} />
            <Row
                data-testid="@trading/selected-offer-provider"
                alignItems="center"
                justifyContent="space-between"
                onClick={onGoToOffers}
                padding={spacings.lg}
            >
                <Text typographyStyle="body">
                    <Translation id="TR_TRADING_PROVIDER" />
                </Text>
                <Row gap={16}>
                    {form.state.isFormLoading ? (
                        <SkeletonRectangle animate />
                    ) : (
                        <>
                            <Column alignItems="flex-end">
                                <TradingUtilsProvider
                                    providers={providers}
                                    exchange={quote.exchange}
                                />
                            </Column>
                            <Icon name="caretRight" size={20} variant="tertiary" />
                        </>
                    )}
                </Row>
            </Row>
        </Column>
    );
};
