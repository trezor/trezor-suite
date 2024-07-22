import { Button } from '@trezor/components';
import styled from 'styled-components';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { useState } from 'react';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { Translation } from 'src/components/suite';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import CoinmarketFormOfferItem from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOfferItem';
import {
    CoinmarketFormInputLabelText,
    CoinmarketFormInputLabelWrapper,
} from 'src/views/wallet/coinmarket';
import CoinmarketFormOfferCryptoAmount from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOfferCryptoAmount';
import {
    coinmarketGetAmountLabels,
    getBestRatedQuote,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import CoinmarketFormOfferFiatAmount from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOfferFiatAmount';

const CoinmarketFormOfferHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: ${spacingsPx.xs};
    margin-top: ${spacingsPx.xxl};

    ${SCREEN_QUERY.MOBILE} {
        margin-top: ${spacingsPx.sm};
    }
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
    const context = useCoinmarketFormContext();
    const {
        type,
        quotes,
        goToOffers,
        getValues,
        selectQuote,
        form: { state },
    } = context;
    const { providers } = getProvidersInfoProps(context);
    const bestScoredQuote = quotes?.[0];
    const bestRatedQuote = getBestRatedQuote(quotes, type);
    const bestScoredQuoteAmounts = getCryptoQuoteAmountProps(bestScoredQuote, context);

    const selectedCrypto = getValues().cryptoSelect;
    const receiveCurrency = bestScoredQuoteAmounts?.receiveCurrency
        ? cryptoToCoinSymbol(bestScoredQuoteAmounts.receiveCurrency)
        : null;
    const { amountInCrypto } = getValues();
    const amountLabels = coinmarketGetAmountLabels({ type, amountInCrypto });

    return (
        <>
            <CoinmarketFormInputLabelWrapper>
                <CoinmarketFormInputLabelText>
                    <Translation id={amountLabels.label2} />
                </CoinmarketFormInputLabelText>
            </CoinmarketFormInputLabelWrapper>
            {amountInCrypto ? (
                <CoinmarketFormOfferFiatAmount
                    amount={
                        !state.isLoadingOrInvalid && bestScoredQuoteAmounts?.sendAmount
                            ? bestScoredQuoteAmounts.sendAmount
                            : '0'
                    }
                />
            ) : (
                <CoinmarketFormOfferCryptoAmount
                    amount={
                        !state.isLoadingOrInvalid && bestScoredQuoteAmounts?.receiveAmount
                            ? bestScoredQuoteAmounts.receiveAmount
                            : '0'
                    }
                    symbol={
                        !state.isLoadingOrInvalid && receiveCurrency
                            ? receiveCurrency
                            : selectedCrypto?.label ?? ''
                    }
                />
            )}
            <CoinmarketFormOfferHeader>
                <CoinmarketFormOfferHeaderText>
                    <Translation id="TR_COINMARKET_YOUR_BEST_OFFER" />
                </CoinmarketFormOfferHeaderText>
                <CoinmarketFormOfferHeaderButton
                    onClick={async () => {
                        setIsCompareLoading(true);
                        await goToOffers();
                    }}
                    isDisabled={state.isLoadingOrInvalid}
                    isLoading={isCompareLoading}
                >
                    <Translation id="TR_COINMARKET_COMPARE_OFFERS" />
                </CoinmarketFormOfferHeaderButton>
            </CoinmarketFormOfferHeader>
            <CoinmarketFormOfferItem
                bestQuote={bestScoredQuote}
                isFormLoading={state.isFormLoading}
                isFormInvalid={state.isFormInvalid}
                providers={providers}
                isBestRate={bestRatedQuote?.orderId === bestScoredQuote?.orderId}
            />
            <Button
                onClick={() => {
                    if (bestScoredQuote) {
                        selectQuote(bestScoredQuote);
                    }
                }}
                type="button"
                variant="primary"
                margin={{
                    top: spacings.xxl,
                }}
                isFullWidth
                isDisabled={state.isLoadingOrInvalid || !bestScoredQuote}
            >
                <Translation id={type === 'sell' ? 'TR_COINMARKET_SELL' : 'TR_BUY'} />
            </Button>
        </>
    );
};

export default CoinmarketFormOffer;
