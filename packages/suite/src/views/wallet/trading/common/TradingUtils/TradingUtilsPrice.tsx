import styled from 'styled-components';

import { spacingsPx, typography } from '@trezor/theme';
import { FONT_SIZE, SCREEN_QUERY } from '@trezor/components/src/config/variables';

import { Translation } from 'src/components/suite';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';
import { TradingFiatAmount } from 'src/views/wallet/trading/common/TradingFiatAmount';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingCryptoAmountProps } from 'src/types/trading/trading';

const PriceWrap = styled.div``;

const PriceTitle = styled.div`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

const PriceValueWrap = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
`;

const PriceValue = styled.div`
    ${typography.titleSmall}
    color: ${({ theme }) => theme.textDefault};
    margin-top: ${spacingsPx.xxs};
    margin-right: ${spacingsPx.sm};

    ${SCREEN_QUERY.MOBILE} {
        font-size: ${FONT_SIZE.BIG};
    }
`;

export const TradingUtilsPrice = ({
    amountInCrypto,
    sendAmount,
    sendCurrency,
    receiveAmount,
    receiveCurrency,
}: TradingCryptoAmountProps) => {
    const { type } = useTradingFormContext();

    return (
        <PriceWrap>
            <PriceTitle>
                <Translation
                    id={
                        tradingGetAmountLabels({
                            type,
                            amountInCrypto: !!amountInCrypto,
                        }).labelComparatorOffer
                    }
                />
            </PriceTitle>
            <PriceValueWrap>
                <PriceValue>
                    {amountInCrypto ? (
                        <TradingFiatAmount amount={sendAmount} currency={sendCurrency} />
                    ) : (
                        <>
                            {receiveCurrency && (
                                <TradingCryptoAmount
                                    amount={receiveAmount}
                                    cryptoId={receiveCurrency}
                                    displayLogo
                                />
                            )}
                        </>
                    )}
                </PriceValue>
                {/*<TradingUtilsTooltip quote={quote} />*/}
            </PriceValueWrap>
        </PriceWrap>
    );
};
