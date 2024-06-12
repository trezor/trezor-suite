import { Badge, Spinner } from '@trezor/components';
import { borders, spacingsPx, typography } from '@trezor/theme';
import styled from 'styled-components';
import { CoinmarketUtilsProvider } from '../CoinmarketUtils/CoinmarketUtilsProvider';

import { BuyTrade } from 'invity-api';

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
    bestQuote: BuyTrade | undefined;
    isFormLoading: boolean;
    isFormInvalid: boolean;
    providers: any;
}

const CoinmarketFormOfferItem = ({
    bestQuote,
    isFormLoading,
    isFormInvalid,
    providers,
}: CoinmarketFormOfferItemProps) => {
    if (isFormLoading || (!bestQuote && !isFormInvalid)) {
        return (
            <CoinmarketFormOfferItemWrapper>
                <CoinmarketFormOfferSpinnerWrapper>
                    <CoinmarketSpinnerWrapper size={32} isGrey={false} />
                    <CoinmarketFormOfferSpinnerText>
                        Looking for your best offer
                    </CoinmarketFormOfferSpinnerText>
                </CoinmarketFormOfferSpinnerWrapper>
            </CoinmarketFormOfferItemWrapper>
        );
    }

    if (isFormInvalid) {
        return (
            <CoinmarketFormOfferItemWrapper>
                <CoinmarketFormOfferSpinnerWrapper>
                    <CoinmarketFormOfferSpinnerText $notSpinner>
                        No offers found for your request. Try a different amount or currency.
                    </CoinmarketFormOfferSpinnerText>
                </CoinmarketFormOfferSpinnerWrapper>
            </CoinmarketFormOfferItemWrapper>
        );
    }

    return (
        <CoinmarketFormOfferItemWrapper>
            <CoinmarketUtilsProvider providers={providers} exchange={bestQuote?.exchange} />
            <Badge variant="primary" size="small">
                Best rate
            </Badge>
        </CoinmarketFormOfferItemWrapper>
    );
};

export default CoinmarketFormOfferItem;
