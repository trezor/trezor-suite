import styled from 'styled-components';

import { Context } from '@suite-common/message-system';
import { getBestRatedQuote } from '@suite-common/trading';
import { spacingsPx } from '@trezor/theme';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';
import { TradingHeader } from 'src/views/wallet/trading/common/TradingHeader/TradingHeader';
import { TradingOffersEmpty } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersEmpty';
import { TradingOffersExchange } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersExchange';
import { TradingOffersItem } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersItem';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xl};
    margin-top: ${spacingsPx.md};
`;

const OffersContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
`;

export const TradingOffers = () => {
    const context = useTradingFormContext();
    const { type, quotes } = context;
    const hasLoadingFailed = !quotes;
    const noOffers = hasLoadingFailed || quotes.length === 0;
    const bestRatedQuote = getBestRatedQuote(quotes, type);

    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    const offers = isTradingExchangeContext(context) ? (
        <TradingOffersExchange />
    ) : (
        <OffersContainer>
            {quotes?.map(quote => (
                <TradingOffersItem
                    key={quote?.orderId}
                    quote={quote}
                    isBestRate={bestRatedQuote?.orderId === quote?.orderId}
                />
            ))}
        </OffersContainer>
    );

    return (
        <>
            {tradingDeviceDisconnected && <ConnectDeviceGenericPromo />}

            <TradingHeader title="TR_TRADING_SHOW_OFFERS" titleTimer="TR_TRADING_OFFERS_REFRESH" />

            <Container>
                {noOffers ? <TradingOffersEmpty /> : offers}

                <ContextMessage context={Context.getLegal('gateway')} />
            </Container>
        </>
    );
};
