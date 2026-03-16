import { type ExchangeTrade } from 'invity-api';
import styled from 'styled-components';

import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import { H3, Icon, Row, Tooltip } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { TradingOffersItem } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersItem';

const OffersContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
`;

interface TradingOffersExchangeQuotesByTypeSectionProps {
    quotes: ExchangeTrade[];
    heading: ExtendedMessageDescriptor['id'];
    tooltip: ExtendedMessageDescriptor['id'];
}

export const TradingOffersExchangeQuotesByTypeSection = ({
    quotes,
    heading,
    tooltip,
}: TradingOffersExchangeQuotesByTypeSectionProps) => {
    if (quotes.length === 0) return null;

    return (
        <>
            <Row
                alignItems="center"
                gap={spacings.xs}
                margin={{ top: spacings.xxxxl, bottom: spacings.xxs }}
            >
                <Tooltip content={<Translation id={tooltip} />}>
                    <H3>
                        <Translation id={heading} />
                    </H3>
                    <Icon name="info" intent="neutral" priority="secondary" size={20} />
                </Tooltip>
            </Row>
            <OffersContainer>
                {quotes.map(quote => (
                    <TradingOffersItem key={quote.orderId} quote={quote} isBestRate={false} />
                ))}
            </OffersContainer>
        </>
    );
};
