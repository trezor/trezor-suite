import { Badge, Spinner } from '@trezor/components';
import { borders, spacingsPx, typography } from '@trezor/theme';
import styled from 'styled-components';
import { BuyTrade, SellFiatTrade } from 'invity-api';
import { Translation } from 'src/components/suite';
import { CoinmarketUtilsProvidersProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketUtilsProvider } from 'src/views/wallet/coinmarket/common/CoinmarketUtils/CoinmarketUtilsProvider';

const CoinmarketFormOfferItemWrapper = styled.div`
    display: flex;
    padding: ${spacingsPx.md};
    gap: ${spacingsPx.xs};
    border-radius: ${borders.radii.sm};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation0};
`;

const CoinmarketFormOfferSpinnerWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${spacingsPx.sm} 0;
    width: 100%;
`;
const CoinmarketFormOfferSpinnerText = styled.div<{ $notSpinner?: boolean }>`
    ${({ $notSpinner }) => ($notSpinner ? typography.label : typography.hint)}
    color: ${({ theme, $notSpinner }) => ($notSpinner ? theme.textDefault : theme.textSubdued)};
    text-align: center;
`;

const CoinmarketSpinnerWrapper = styled(Spinner)`
    flex: none;
    margin: 0 ${spacingsPx.xs};
`;

interface CoinmarketFormOfferItemProps {
    bestQuote: BuyTrade | SellFiatTrade | undefined;
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
    isBestRate,
}: CoinmarketFormOfferItemProps) => {
    if (!bestQuote || isFormLoading) {
        if (isFormLoading && !isFormInvalid) {
            return (
                <CoinmarketFormOfferItemWrapper>
                    <CoinmarketFormOfferSpinnerWrapper>
                        <CoinmarketSpinnerWrapper size={32} isGrey={false} />
                        <CoinmarketFormOfferSpinnerText>
                            <Translation id="TR_COINMARKET_OFFER_LOOKING" />
                        </CoinmarketFormOfferSpinnerText>
                    </CoinmarketFormOfferSpinnerWrapper>
                </CoinmarketFormOfferItemWrapper>
            );
        }

        return (
            <CoinmarketFormOfferItemWrapper>
                <CoinmarketFormOfferSpinnerWrapper>
                    <CoinmarketFormOfferSpinnerText $notSpinner>
                        <Translation id="TR_COINMARKET_OFFER_NO_FOUND" />
                    </CoinmarketFormOfferSpinnerText>
                </CoinmarketFormOfferSpinnerWrapper>
            </CoinmarketFormOfferItemWrapper>
        );
    }

    return (
        <CoinmarketFormOfferItemWrapper>
            <CoinmarketUtilsProvider providers={providers} exchange={bestQuote?.exchange} />
            {isBestRate && (
                <Badge variant="primary" size="small">
                    <Translation id="TR_COINMARKET_BEST_RATE" />
                </Badge>
            )}
        </CoinmarketFormOfferItemWrapper>
    );
};

export default CoinmarketFormOfferItem;
