import { Badge, Button, H2 } from '@trezor/components';
import { CoinmarketCryptoAmount } from '..';
import { CoinmarketFormInputLabel } from '../..';
import styled from 'styled-components';
import { borders, spacings, spacingsPx, typography } from '@trezor/theme';
import { CoinmarketUtilsProvider } from '../CoinmarketUtils/CoinmarketUtilsProvider';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';

const CoinmarketFormOfferAmount = styled(H2)`
    margin-top: ${spacingsPx.md};
`;

const CoinmarketFormOfferHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: ${spacingsPx.xs};
    margin-top: ${spacingsPx.xxl};
`;
const CoinmarketFormOfferHeaderText = styled.div``;
const CoinmarketFormOfferHeaderButton = styled(Button)`
    border: 0;
    outline: 0;
    padding: 0;
    cursor: pointer;
    background: ${({ theme }) => theme.transparent};
    margin-top: ${spacingsPx.xxxs};

    div {
        ${typography.hint}
        color: ${({ theme }) => theme.textPrimaryDefault};
    }

    &:hover {
        background: ${({ theme }) => theme.transparent};
    }

    &:disabled {
        background: ${({ theme }) => theme.transparent};
    }
`;

const CoinmarketFormOfferItem = styled.div`
    display: flex;
    padding: ${spacingsPx.md};
    gap: ${spacingsPx.xs};
    border-radius: ${borders.radii.sm};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation0};
`;

const CoinmarketFormOffer = () => {
    const { watch, formState } = useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues =
        (watch('fiatInput') || watch('cryptoInput')) && !!watch('currencySelect').value;

    const providers = {
        '1inch': {
            companyName: '1inch',
            logo: '1inch-icon.png',
            brandName: '1inch',
        },
    } as {
        [name: string]: {
            logo: string;
            companyName: string;
            brandName?: string;
        };
    };
    const exchange = '1inch'; // quote.exchange
    // TODO: loading, noProviders

    return (
        <>
            <CoinmarketFormInputLabel>You get</CoinmarketFormInputLabel>
            <CoinmarketFormOfferAmount>
                <CoinmarketCryptoAmount amount="0.0001" symbol="BTC" displayLogo="center" />
            </CoinmarketFormOfferAmount>
            <CoinmarketFormOfferHeader>
                <CoinmarketFormOfferHeaderText>Your best offer</CoinmarketFormOfferHeaderText>
                <CoinmarketFormOfferHeaderButton
                    type="submit"
                    isDisabled={!(formIsValid && hasValues) || formState.isSubmitting}
                    isLoading={formState.isSubmitting}
                >
                    Compare all offers
                </CoinmarketFormOfferHeaderButton>
            </CoinmarketFormOfferHeader>
            <CoinmarketFormOfferItem>
                <CoinmarketUtilsProvider providers={providers} exchange={exchange} />
                <Badge variant="primary" size="small">
                    Best rate
                </Badge>
            </CoinmarketFormOfferItem>

            <Button
                type="button"
                variant="primary"
                margin={{
                    top: spacings.xxl,
                }}
                isFullWidth
            >
                Buy
            </Button>
        </>
    );
};

export default CoinmarketFormOffer;
