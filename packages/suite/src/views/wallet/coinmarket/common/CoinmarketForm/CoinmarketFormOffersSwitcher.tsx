import styled from 'styled-components';
import {
    borders,
    Elevation,
    mapElevationToBackground,
    nativeTypography,
    spacingsPx,
} from '@trezor/theme';
import { Row, useElevation } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ExchangeTrade } from 'invity-api';
import {
    CoinmarketTradeDetailType,
    CoinmarketUtilsProvidersProps,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormOffersSwitcherItem } from './CoinmarketFormOffersSwitcherItem';
import { CoinmarketExchangeFormContextProps } from 'src/types/coinmarket/coinmarketForm';
import {
    FORM_EXCHANGE_CEX,
    FORM_EXCHANGE_DEX,
    FORM_EXCHANGE_TYPE,
} from 'src/constants/wallet/coinmarket/form';
import {
    CoinmarketFormOfferSpinnerText,
    CoinmarketFormOfferSpinnerWrapper,
    CoinmarketSpinnerWrapper,
} from 'src/views/wallet/coinmarket';

const BestOffers = styled.div<{ $elevation: Elevation }>`
    padding: ${spacingsPx.xxs};
    gap: ${spacingsPx.xxs};
    border-radius: ${borders.radii.md};
    background-color: ${mapElevationToBackground};
`;

const ProviderNotFound = styled.div`
    text-align: center;
    padding: ${spacingsPx.md};
    font-size: ${nativeTypography.label.fontSize}px;
    color: ${({ theme }) => theme.textSubdued};
`;

const NoOffers = styled.div`
    height: 116px;
    display: flex;
    align-items: center;
    padding: ${spacingsPx.md};
`;

interface CoinmarketFormOffersSwitcherProps {
    context: CoinmarketExchangeFormContextProps;
    isFormLoading: boolean;
    isFormInvalid: boolean;
    providers: CoinmarketUtilsProvidersProps | undefined;
    quotes: ExchangeTrade[] | undefined;
    bestRatedQuote: CoinmarketTradeDetailType | undefined;
}

export const CoinmarketFormOffersSwitcher = ({
    context,
    isFormLoading,
    isFormInvalid,
    providers,
    quotes,
    bestRatedQuote,
}: CoinmarketFormOffersSwitcherProps) => {
    const { setValue, getValues, dexQuotes } = context;
    const { exchangeType } = getValues();
    const { elevation } = useElevation();
    const cexQuote = quotes?.[0];
    const dexQuote = dexQuotes?.[0];
    const hasSingleOption = !cexQuote !== !dexQuote;
    const bestQuote = cexQuote ?? dexQuote;

    if (!bestQuote || isFormLoading) {
        if (isFormLoading && !isFormInvalid) {
            return (
                <BestOffers $elevation={elevation}>
                    <NoOffers>
                        <CoinmarketFormOfferSpinnerWrapper>
                            <Row justifyContent="center" alignItems="center">
                                <CoinmarketSpinnerWrapper size={32} isGrey={false} />
                                <CoinmarketFormOfferSpinnerText>
                                    <Translation id="TR_COINMARKET_OFFER_LOOKING" />
                                </CoinmarketFormOfferSpinnerText>
                            </Row>
                        </CoinmarketFormOfferSpinnerWrapper>
                    </NoOffers>
                </BestOffers>
            );
        }

        return (
            <BestOffers $elevation={elevation}>
                <NoOffers>
                    <CoinmarketFormOfferSpinnerWrapper>
                        <Row justifyContent="center" alignItems="center">
                            <CoinmarketFormOfferSpinnerText $withoutSpinner>
                                <Translation id="TR_COINMARKET_OFFER_NO_FOUND" />
                            </CoinmarketFormOfferSpinnerText>
                        </Row>
                    </CoinmarketFormOfferSpinnerWrapper>
                </NoOffers>
            </BestOffers>
        );
    }

    return (
        <BestOffers $elevation={elevation}>
            {cexQuote ? (
                <CoinmarketFormOffersSwitcherItem
                    selectedExchangeType={exchangeType}
                    isSelectable={!hasSingleOption}
                    onSelect={() => setValue(FORM_EXCHANGE_TYPE, FORM_EXCHANGE_CEX)}
                    providers={providers}
                    quote={cexQuote}
                    isBestRate={bestRatedQuote?.orderId === cexQuote?.orderId}
                />
            ) : (
                <ProviderNotFound>
                    <Translation id="TR_COINMARKET_NO_CEX_PROVIDER_FOUND" />
                </ProviderNotFound>
            )}
            {dexQuote ? (
                <CoinmarketFormOffersSwitcherItem
                    selectedExchangeType={exchangeType}
                    isSelectable={!hasSingleOption}
                    onSelect={() => setValue(FORM_EXCHANGE_TYPE, FORM_EXCHANGE_DEX)}
                    providers={providers}
                    quote={dexQuote}
                    isBestRate={bestRatedQuote?.orderId === dexQuote?.orderId}
                />
            ) : (
                <ProviderNotFound>
                    <Translation id="TR_COINMARKET_NO_DEX_PROVIDER_FOUND" />
                </ProviderNotFound>
            )}
        </BestOffers>
    );
};
