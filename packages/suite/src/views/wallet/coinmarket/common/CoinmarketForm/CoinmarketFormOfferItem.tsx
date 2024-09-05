import { Row, useElevation } from '@trezor/components';
import { borders, Elevation, mapElevationToBackground, spacingsPx } from '@trezor/theme';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import {
    CoinmarketTradeDetailType,
    CoinmarketUtilsProvidersProps,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketUtilsProvider } from 'src/views/wallet/coinmarket/common/CoinmarketUtils/CoinmarketUtilsProvider';
import {
    CoinmarketFormOfferSpinnerText,
    CoinmarketFormOfferSpinnerWrapper,
    CoinmarketSpinnerWrapper,
} from 'src/views/wallet/coinmarket';

const CoinmarketFormOfferItemWrapper = styled.div<{ $elevation: Elevation }>`
    display: flex;
    padding: ${spacingsPx.md};
    gap: ${spacingsPx.xs};
    border-radius: ${borders.radii.sm};
    background-color: ${mapElevationToBackground};
`;

interface CoinmarketFormOfferItemProps {
    bestQuote: CoinmarketTradeDetailType | undefined;
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
                        <CoinmarketFormOfferSpinnerText>
                            <Translation id="TR_COINMARKET_OFFER_NO_FOUND" />
                            <br />
                            <Translation id="TR_COINMARKET_CHANGE_AMOUNT_OR_CURRENCY" />
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
