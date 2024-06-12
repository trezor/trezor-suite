import { Button, H2 } from '@trezor/components';
import { CoinmarketCryptoAmount } from '..';
import { CoinmarketFormInputLabel } from '../..';
import styled from 'styled-components';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import CoinmarketFormOfferItem from './CoinmarketFormOfferItem';
import { getProvidersInfoProps } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { useState } from 'react';

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

    [class^='Spinner'] {
        filter: none;
    }
`;

const CoinmarketFormOffer = () => {
    const [isCompareLoading, setIsCompareLoading] = useState<boolean>(false);
    const context = useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const {
        quotes,
        account,
        goToOffers,
        selectQuote,
        form: { state },
    } = context;
    const { providers } = getProvidersInfoProps(context);
    const bestQuote = quotes?.[0];

    return (
        <>
            <CoinmarketFormInputLabel>You get</CoinmarketFormInputLabel>
            <CoinmarketFormOfferAmount>
                <CoinmarketFormOfferCryptoAmount
                    amount={
                        !state.isLoadingOrInvalid && bestQuote?.receiveStringAmount
                            ? bestQuote?.receiveStringAmount
                            : '0'
                    }
                    symbol={
                        !state.isLoadingOrInvalid && bestQuote?.receiveCurrency
                            ? bestQuote?.receiveCurrency
                            : account.symbol.toUpperCase()
                    }
                    displayLogo="center"
                />
            </CoinmarketFormOfferAmount>
            <CoinmarketFormOfferHeader>
                <CoinmarketFormOfferHeaderText>Your best offer</CoinmarketFormOfferHeaderText>
                <CoinmarketFormOfferHeaderButton
                    onClick={async () => {
                        setIsCompareLoading(true);
                        await goToOffers();
                    }}
                    isDisabled={state.isLoadingOrInvalid}
                    isLoading={isCompareLoading}
                >
                    Compare all offers
                </CoinmarketFormOfferHeaderButton>
            </CoinmarketFormOfferHeader>
            <CoinmarketFormOfferItem
                bestQuote={bestQuote}
                isFormLoading={state.isFormLoading}
                isFormInvalid={state.isFormInvalid}
                providers={providers}
            />
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
                isDisabled={state.isLoadingOrInvalid || !bestQuote}
            >
                Buy
            </Button>
        </>
    );
};

export default CoinmarketFormOffer;
