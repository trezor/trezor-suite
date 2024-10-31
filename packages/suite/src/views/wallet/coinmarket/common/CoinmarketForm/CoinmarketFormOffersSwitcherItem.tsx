import { ExchangeTrade } from 'invity-api';
import { CoinmarketUtilsProvidersProps } from 'src/types/coinmarket/coinmarket';
import { Badge, Radio, Tooltip, Row, Text, useElevation } from '@trezor/components';
import { Translation } from 'src/components/suite';
import styled from 'styled-components';
import { borders, spacings, spacingsPx, mapElevationToBackground, Elevation } from '@trezor/theme';
import { ExchangeType } from 'src/types/coinmarket/coinmarketForm';
import { FORM_EXCHANGE_CEX, FORM_EXCHANGE_DEX } from 'src/constants/wallet/coinmarket/form';
import { CoinmarketUtilsProvider } from 'src/views/wallet/coinmarket/common/CoinmarketUtils/CoinmarketUtilsProvider';

const Offer = styled.div<{ $isSelected: boolean; $elevation: Elevation }>`
    padding: ${spacingsPx.md};
    border-radius: ${borders.radii.sm};
    background: ${mapElevationToBackground};

    ${({ $isSelected }) => !$isSelected && 'background: none;'}
`;

interface CoinmarketFormOffersSwitcherItemProps {
    isSelectable: boolean;
    onSelect: (_quote: ExchangeTrade) => void;
    quote: ExchangeTrade;
    selectedExchangeType: ExchangeType;
    providers: CoinmarketUtilsProvidersProps | undefined;
    isBestRate?: boolean;
}

export const CoinmarketFormOffersSwitcherItem = ({
    selectedExchangeType,
    onSelect,
    quote,
    providers,
    isBestRate,
    isSelectable,
}: CoinmarketFormOffersSwitcherItemProps) => {
    const exchangeType = quote.isDex ? FORM_EXCHANGE_DEX : FORM_EXCHANGE_CEX;
    const isSelected = Boolean(selectedExchangeType === exchangeType);
    const { elevation } = useElevation();

    const content = (
        <Row gap={spacings.xs} flex="1">
            <CoinmarketUtilsProvider providers={providers} exchange={quote.exchange} />
            {isBestRate && (
                <Badge variant="primary" size="small">
                    <Translation id="TR_COINMARKET_BEST_RATE" />
                </Badge>
            )}
            <Text variant="primary" as="div" margin={{ left: 'auto' }}>
                <Tooltip content={<Translation id={`TR_COINMARKET_${exchangeType}_TOOLTIP`} />}>
                    {exchangeType}
                </Tooltip>
            </Text>
        </Row>
    );

    return (
        <Offer $isSelected={isSelected} $elevation={elevation}>
            {isSelectable ? (
                <Radio labelAlignment="left" isChecked={isSelected} onClick={() => onSelect(quote)}>
                    {content}
                </Radio>
            ) : (
                content
            )}
        </Offer>
    );
};
