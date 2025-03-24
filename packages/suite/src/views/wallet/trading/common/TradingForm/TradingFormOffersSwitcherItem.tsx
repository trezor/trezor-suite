import { ExchangeTrade } from 'invity-api';
import styled from 'styled-components';

import {
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    TradingExchangeFormType,
    type TradingUtilsProvidersProps,
} from '@suite-common/trading';
import { Badge, Radio, Row, Text, Tooltip, useElevation } from '@trezor/components';
import { Elevation, borders, mapElevationToBackground, spacings, spacingsPx } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { TradingUtilsProvider } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsProvider';

const Offer = styled.div<{ $isSelected: boolean; $elevation: Elevation }>`
    padding: ${spacingsPx.md};
    border-radius: ${borders.radii.sm};
    background: ${mapElevationToBackground};

    ${({ $isSelected }) => !$isSelected && 'background: none;'}
`;

interface TradingFormOffersSwitcherItemProps {
    isSelectable: boolean;
    onSelect: (_quote: ExchangeTrade) => void;
    quote: ExchangeTrade;
    selectedExchangeType: TradingExchangeFormType;
    providers: TradingUtilsProvidersProps | undefined;
    isBestRate?: boolean;
}

export const TradingFormOffersSwitcherItem = ({
    selectedExchangeType,
    onSelect,
    quote,
    providers,
    isBestRate,
    isSelectable,
}: TradingFormOffersSwitcherItemProps) => {
    const exchangeType = quote.isDex ? TRADING_EXCHANGE_FORM_DEX : TRADING_EXCHANGE_FORM_CEX;
    const isSelected = Boolean(selectedExchangeType === exchangeType);
    const { elevation } = useElevation();

    const content = (
        <Row gap={spacings.xs} flex="1">
            <TradingUtilsProvider providers={providers} exchange={quote.exchange} />
            {isBestRate && (
                <Badge variant="primary" size="small">
                    <Translation id="TR_TRADING_BEST_RATE" />
                </Badge>
            )}
            <Text variant="primary" as="div" margin={{ left: 'auto' }}>
                <Tooltip content={<Translation id={`TR_TRADING_${exchangeType}_TOOLTIP`} />}>
                    {exchangeType}
                </Tooltip>
            </Text>
        </Row>
    );

    return (
        <Offer $isSelected={isSelected} $elevation={elevation}>
            {isSelectable ? (
                <Radio
                    labelAlignment="start"
                    isChecked={isSelected}
                    onClick={() => onSelect(quote)}
                >
                    {content}
                </Radio>
            ) : (
                content
            )}
        </Offer>
    );
};
