import { CryptoId } from 'invity-api';
import styled from 'styled-components';

import { Tooltip } from '@trezor/components';
import { FONT_SIZE, SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacingsPx, typography } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingCryptoAmountProps } from 'src/types/trading/trading';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';
import { TradingFiatAmount } from 'src/views/wallet/trading/common/TradingFiatAmount';

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
                {type === 'sell' ? (
                    <Tooltip
                        hasIcon
                        placement="right"
                        content={
                            <Translation
                                id="TR_SELL_PROVIDER_ADJUSTED_AMOUNT"
                                values={{
                                    roundedAmountWithSymbol: (
                                        <TradingCryptoAmount
                                            amount={receiveAmount}
                                            cryptoId={receiveCurrency as CryptoId}
                                        />
                                    ),
                                }}
                            />
                        }
                    >
                        <Translation
                            id={
                                tradingGetAmountLabels({
                                    type,
                                    amountInCrypto: !!amountInCrypto,
                                }).labelComparatorOffer
                            }
                        />
                    </Tooltip>
                ) : (
                    <Translation
                        id={
                            tradingGetAmountLabels({
                                type,
                                amountInCrypto: !!amountInCrypto,
                            }).labelComparatorOffer
                        }
                    />
                )}
            </PriceTitle>
            <PriceValueWrap data-testid="@trading/offers/quote/amount">
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
