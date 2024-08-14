import { ExchangeTrade } from 'invity-api';
import { CoinmarketUtilsProvidersProps } from 'src/types/coinmarket/coinmarket';
import { Badge, Radio, Tooltip } from '@trezor/components';
import { CoinmarketUtilsProvider } from '../CoinmarketUtils/CoinmarketUtilsProvider';
import { Translation } from 'src/components/suite';
import styled, { css } from 'styled-components';
import { borders, spacingsPx } from '@trezor/theme';
import { ExchangeType } from 'src/types/coinmarket/coinmarketForm';
import { FORM_EXCHANGE_CEX, FORM_EXCHANGE_DEX } from 'src/constants/wallet/coinmarket/form';

const Offer = styled.div<{ $isSelected: boolean }>`
    padding: ${spacingsPx.md};
    border-radius: ${borders.radii.sm};

    /* full width radio label */
    & > div[class^='Checkbox__'] > div:last-child {
        width: 100%;
    }

    .content {
        display: flex;
        align-items: center;
        width: 100%;
        gap: ${spacingsPx.xs};
    }

    .exchange-type {
        color: ${({ theme }) => theme.textPrimaryDefault};
        margin-left: auto;
    }

    ${({ $isSelected }) =>
        $isSelected
            ? css`
                  background-color: ${({ theme }) => theme.backgroundSurfaceElevation1};
              `
            : css`
                  .name {
                      color: ${({ theme }) => theme.textDisabled};
                  }

                  .exchange-type {
                      color: ${({ theme }) => theme.textSubdued};
                  }
              `}
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

    const content = (
        <div className="content">
            <CoinmarketUtilsProvider providers={providers} exchange={quote.exchange} />
            {isBestRate && (
                <Badge variant="primary" size="small">
                    <Translation id="TR_COINMARKET_BEST_RATE" />
                </Badge>
            )}
            <div className="exchange-type">
                <Tooltip content={<Translation id={`TR_COINMARKET_${exchangeType}_TOOLTIP`} />}>
                    {exchangeType}
                </Tooltip>
            </div>
        </div>
    );

    return (
        <Offer $isSelected={isSelected}>
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
