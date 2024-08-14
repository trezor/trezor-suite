import styled, { css, useTheme } from 'styled-components';
import { borders, spacingsPx } from '@trezor/theme';
import { variables } from '@trezor/components/src/config';
import { Badge, Radio, Spinner, Text, Tooltip } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { CoinmarketUtilsProvider } from 'src/views/wallet/coinmarket/common/CoinmarketUtils/CoinmarketUtilsProvider';
import { ExchangeTrade } from 'invity-api';
import { CoinmarketUtilsProvidersProps } from 'src/types/coinmarket/coinmarket';
import { getBestRatedQuote } from 'src/utils/wallet/coinmarket/coinmarketUtils';

const BestOffers = styled.div`
    padding: ${spacingsPx.xxs};
    gap: ${spacingsPx.xxs};
    border-radius: ${borders.radii.md};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation2};
`;

const Offer = styled.div<{ $isSelected: boolean }>`
    padding: ${spacingsPx.md};
    border-radius: ${borders.radii.sm};

    /* full width radio label */
    & > div > div:last-child {
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

const ProviderNotFound = styled.div`
    text-align: center;
    padding: ${spacingsPx.md};
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.textSubdued};
`;

const NoOffers = styled.div`
    height: 116px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${spacingsPx.xs};
    padding: ${spacingsPx.md};
    font-size: ${variables.FONT_SIZE.TINY};
`;

interface OfferItemProps {
    isSelectable: boolean;
    onSelect: (_quote: ExchangeTrade) => void;
    quote: ExchangeTrade;
    selectedQuote: ExchangeTrade | undefined;
    providers: CoinmarketUtilsProvidersProps | undefined;
    isBestRate?: boolean;
}

const OfferItem = ({
    selectedQuote,
    onSelect,
    quote,
    providers,
    isBestRate,
    isSelectable,
}: OfferItemProps) => {
    const exchangeType = quote.isDex ? 'DEX' : 'CEX';
    const isSelected = isSelectable && selectedQuote?.isDex === quote.isDex;

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
                <div>{content}</div>
            )}
        </Offer>
    );
};

interface CoinmarketFormOffersSwitcherProps {
    isFormLoading: boolean;
    isFormInvalid: boolean;
    providers: CoinmarketUtilsProvidersProps | undefined;
    quotes: ExchangeTrade[] | undefined;
    selectedQuote: ExchangeTrade | undefined;
    setSelectedQuote: (quote: ExchangeTrade | undefined) => void;
}

const CoinmarketFormOffersSwitcher = ({
    isFormLoading,
    isFormInvalid,
    providers,
    quotes = [],
    selectedQuote,
    setSelectedQuote,
}: CoinmarketFormOffersSwitcherProps) => {
    const theme = useTheme();
    const bestRatedQuote = getBestRatedQuote(quotes, 'exchange');
    const cexOffer = quotes.find(quote => !quote.isDex);
    const dexOffer = quotes.find(quote => quote.isDex);
    const hasSingleOption = !cexOffer !== !dexOffer;

    // TODO: check
    // useEffect(() => {
    //     console.log(`changed`, selectedQuote);
    //     if (quotes.length && !quotes.some(quote => quote.orderId === selectedQuote?.orderId))
    //         setSelectedQuote(quotes[0]);
    // }, [quotes, selectedQuote, setSelectedQuote]);

    if (isFormLoading && !isFormInvalid) {
        return (
            <BestOffers>
                <NoOffers>
                    <Spinner size={32} isGrey={false} />
                    <Text typographyStyle="hint" color={theme.textSubdued}>
                        <Translation id="TR_COINMARKET_OFFER_LOOKING" />
                    </Text>
                </NoOffers>
            </BestOffers>
        );
    }

    if (!quotes.length) {
        return (
            <BestOffers>
                <NoOffers>
                    <Translation id="TR_COINMARKET_OFFER_NO_FOUND" />
                </NoOffers>
            </BestOffers>
        );
    }

    return (
        <BestOffers>
            {cexOffer ? (
                <OfferItem
                    selectedQuote={selectedQuote}
                    isSelectable={!hasSingleOption}
                    onSelect={() => setSelectedQuote(cexOffer)}
                    providers={providers}
                    quote={cexOffer}
                    isBestRate={bestRatedQuote?.orderId === cexOffer?.orderId}
                />
            ) : (
                <ProviderNotFound>
                    <Translation id="TR_COINMARKET_NO_CEX_PROVIDER_FOUND" />
                </ProviderNotFound>
            )}
            {dexOffer ? (
                <OfferItem
                    selectedQuote={selectedQuote}
                    isSelectable={!hasSingleOption}
                    onSelect={() => setSelectedQuote(dexOffer)}
                    providers={providers}
                    quote={dexOffer}
                    isBestRate={bestRatedQuote?.orderId === dexOffer?.orderId}
                />
            ) : (
                <ProviderNotFound>
                    <Translation id="TR_COINMARKET_NO_DEX_PROVIDER_FOUND" />
                </ProviderNotFound>
            )}
        </BestOffers>
    );
};

export default CoinmarketFormOffersSwitcher;
