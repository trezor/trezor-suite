import { Row, Spinner, useElevation } from '@trezor/components';
import {
    borders,
    Elevation,
    mapElevationToBackground,
    spacingsPx,
    typography,
} from '@trezor/theme';
import styled from 'styled-components';
import { BuyTrade, ExchangeTrade, SellFiatTrade } from 'invity-api';
import { Translation } from 'src/components/suite';
import { CoinmarketUtilsProvidersProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketUtilsProvider } from 'src/views/wallet/coinmarket/common/CoinmarketUtils/CoinmarketUtilsProvider';

const CoinmarketFormOfferItemWrapper = styled.div<{ $elevation: Elevation }>`
    display: flex;
    padding: ${spacingsPx.md};
    gap: ${spacingsPx.xs};
    border-radius: ${borders.radii.sm};
    background-color: ${mapElevationToBackground};
`;

const CoinmarketFormOfferSpinnerWrapper = styled.div`
    width: 100%;
    padding: ${spacingsPx.sm} 0;
`;
const CoinmarketFormOfferSpinnerText = styled.div<{ $withoutSpinner?: boolean }>`
    ${({ $withoutSpinner }) => ($withoutSpinner ? typography.label : typography.hint)}
    color: ${({ theme, $withoutSpinner }) =>
        $withoutSpinner ? theme.textDefault : theme.textSubdued};
    text-align: center;
`;

const CoinmarketSpinnerWrapper = styled(Spinner)`
    flex: none;
    margin: 0 ${spacingsPx.xs};
`;

interface CoinmarketFormOfferItemProps {
    bestQuote: BuyTrade | SellFiatTrade | ExchangeTrade | undefined;
    isFormLoading: boolean;
    isFormInvalid: boolean;
    providers: CoinmarketUtilsProvidersProps | undefined;
    isBestRate?: boolean;
}

const CoinmarketFormOfferItem = ({
    bestQuote,
    isFormLoading,
    isFormInvalid,
    providers,
}: CoinmarketFormOfferItemProps) => {
    const { elevation } = useElevation();

    if (!bestQuote || isFormLoading) {
        if (isFormLoading && !isFormInvalid) {
            return (
                <CoinmarketFormOfferItemWrapper $elevation={elevation}>
                    <CoinmarketFormOfferSpinnerWrapper>
                        <Row justifyContent="center" alignItems="center">
                            <CoinmarketSpinnerWrapper size={32} isGrey={false} />
                            <CoinmarketFormOfferSpinnerText>
                                <Translation id="TR_COINMARKET_OFFER_LOOKING" />
                            </CoinmarketFormOfferSpinnerText>
                        </Row>
                    </CoinmarketFormOfferSpinnerWrapper>
                </CoinmarketFormOfferItemWrapper>
            );
        }

        return (
            <CoinmarketFormOfferItemWrapper $elevation={elevation}>
                <CoinmarketFormOfferSpinnerWrapper>
                    <Row justifyContent="center" alignItems="center">
                        <CoinmarketFormOfferSpinnerText $withoutSpinner>
                            <Translation id="TR_COINMARKET_OFFER_NO_FOUND" />
                        </CoinmarketFormOfferSpinnerText>
                    </Row>
                </CoinmarketFormOfferSpinnerWrapper>
            </CoinmarketFormOfferItemWrapper>
        );
    }

    return (
        <CoinmarketFormOfferItemWrapper $elevation={elevation}>
            <CoinmarketUtilsProvider providers={providers} exchange={bestQuote?.exchange} />
        </CoinmarketFormOfferItemWrapper>
    );
};

export default CoinmarketFormOfferItem;
