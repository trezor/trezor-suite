import { Badge, Button, H2 } from '@trezor/components';
import { CoinmarketCryptoAmount, CoinmarketRefreshTime } from '..';
import { CoinmarketFormInputLabel } from '../..';
import styled from 'styled-components';
import { borders, spacings, spacingsPx, typography } from '@trezor/theme';
import { CoinmarketUtilsProvider } from '../CoinmarketUtils/CoinmarketUtilsProvider';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { getProvidersInfoProps } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { Loading } from 'src/components/suite';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';

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
    const context = useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const { formState, watch, quotes, account, isLoading, timer, goToOffers, selectQuote } =
        context;
    const { providers } = getProvidersInfoProps(context);
    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues =
        (watch('fiatInput') || watch('cryptoInput')) && !!watch('currencySelect').value;

    const bestQuote = quotes?.[0];
    const isQuoteLoading = isLoading || typeof bestQuote === undefined;

    return (
        <>
            <CoinmarketRefreshTime
                isLoading={timer.isLoading}
                refetchInterval={InvityAPIReloadQuotesAfterSeconds}
                seconds={timer.timeSpend.seconds}
                label={<>TEST</>}
            />
            <CoinmarketFormInputLabel>You get</CoinmarketFormInputLabel>
            <CoinmarketFormOfferAmount>
                <CoinmarketCryptoAmount
                    amount={!isQuoteLoading ? bestQuote?.receiveStringAmount : '0'}
                    symbol={
                        !isQuoteLoading ? bestQuote?.receiveCurrency : account.symbol.toUpperCase()
                    }
                    displayLogo="center"
                />
            </CoinmarketFormOfferAmount>
            <CoinmarketFormOfferHeader>
                <CoinmarketFormOfferHeaderText>Your best offer</CoinmarketFormOfferHeaderText>
                <CoinmarketFormOfferHeaderButton
                    onClick={goToOffers}
                    isDisabled={
                        isQuoteLoading || !(formIsValid && hasValues) || formState.isSubmitting
                    }
                    isLoading={isQuoteLoading || formState.isSubmitting}
                >
                    Compare all offers
                </CoinmarketFormOfferHeaderButton>
            </CoinmarketFormOfferHeader>
            <CoinmarketFormOfferItem>
                {!isQuoteLoading ? (
                    <>
                        <CoinmarketUtilsProvider
                            providers={providers}
                            exchange={bestQuote?.exchange}
                        />
                        <Badge variant="primary" size="small">
                            Best rate
                        </Badge>
                    </>
                ) : (
                    <Loading />
                )}
            </CoinmarketFormOfferItem>

            <Button
                onClick={() => {
                    if (bestQuote) {
                        selectQuote(bestQuote);
                    }
                }}
                type="button"
                variant="primary"
                margin={{
                    top: spacings.xxl,
                }}
                isFullWidth
                isDisabled={isQuoteLoading || !(formIsValid && hasValues) || formState.isSubmitting}
            >
                Buy
            </Button>
        </>
    );
};

export default CoinmarketFormOffer;
