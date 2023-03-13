import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation, FormattedCryptoAmount, FiatValue, FormattedDate } from '@suite-components';
import { AmountRow } from './AmountRow';
import { NetworkSymbol, WalletAccountTransaction } from '@wallet-types';
import {
    formatAmount,
    formatCardanoDeposit,
    formatCardanoWithdrawal,
    formatNetworkAmount,
} from '@suite-common/wallet-utils';

const MainContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const AmountWrapper = styled.div`
    display: grid;
    grid-gap: 5px;

    /* columns: 1. title, 2. crypto amount, 3. fiat amount old, 4. fiat amount now */
    grid-template-columns: 140px minmax(110px, auto) minmax(100px, auto) minmax(100px, auto);

    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    align-items: center;
    overflow: visible;
    word-break: break-all;

    ${variables.SCREEN_QUERY.MOBILE} {
        /* decrease the width of the first (title) column on small screen */
        grid-template-columns: 90px minmax(110px, auto) minmax(100px, auto) minmax(100px, auto);
        overflow-x: auto;
    }
`;

interface AmountDetailsProps {
    tx: WalletAccountTransaction;
    isTestnet: boolean;
}

// TODO: Do not show FEE for sent but not mine transactions
export const AmountDetails = ({ tx, isTestnet }: AmountDetailsProps) => {
    const totalInput = formatNetworkAmount(tx.details.totalInput, tx.symbol);
    const totalOutput = formatNetworkAmount(tx.details.totalOutput, tx.symbol);
    const amount = formatNetworkAmount(tx.amount, tx.symbol);
    const fee = formatNetworkAmount(tx.fee, tx.symbol);
    const cardanoWithdrawal = formatCardanoWithdrawal(tx);
    const cardanoDeposit = formatCardanoDeposit(tx);

    return (
        <MainContainer>
            <AmountWrapper>
                {/* ROW CONTAINING DATES FOR FIAT VALUES */}
                {!isTestnet && (
                    <AmountRow
                        // keep the first two columns empty for the first row
                        thirdColumn={
                            tx.blockTime && (
                                <FormattedDate value={new Date(tx.blockTime * 1000)} date />
                            )
                        }
                        fourthColumn={
                            <Translation
                                id="TR_TODAY_DATE"
                                values={{
                                    date: (
                                        <FiatValue amount="1" symbol={tx.symbol}>
                                            {({ timestamp }) =>
                                                timestamp ? (
                                                    <FormattedDate
                                                        value={timestamp}
                                                        date
                                                        year={undefined}
                                                    />
                                                ) : null
                                            }
                                        </FiatValue>
                                    ),
                                }}
                            />
                        }
                        color="light"
                    />
                )}

                {!['xrp', 'eth'].includes(tx.symbol) && (
                    <>
                        {/* TOTAL INPUT */}
                        <AmountRow
                            firstColumn={<Translation id="TR_TOTAL_INPUT" />}
                            secondColumn={
                                <FormattedCryptoAmount value={totalInput} symbol={tx.symbol} />
                            }
                            thirdColumn={
                                !tx.tokens.length &&
                                totalInput && (
                                    <FiatValue
                                        amount={totalInput}
                                        symbol={tx.symbol}
                                        source={tx.rates}
                                        useCustomSource
                                    />
                                )
                            }
                            fourthColumn={
                                totalInput && <FiatValue amount={totalInput} symbol={tx.symbol} />
                            }
                            color="dark"
                        />

                        {/* TOTAL OUTPUT */}
                        <AmountRow
                            firstColumn={<Translation id="TR_TOTAL_OUTPUT" />}
                            secondColumn={
                                <FormattedCryptoAmount value={totalOutput} symbol={tx.symbol} />
                            }
                            thirdColumn={
                                !tx.tokens.length &&
                                totalOutput && (
                                    <FiatValue
                                        amount={totalOutput}
                                        symbol={tx.symbol}
                                        source={tx.rates}
                                        useCustomSource
                                    />
                                )
                            }
                            fourthColumn={
                                totalOutput && <FiatValue amount={totalOutput} symbol={tx.symbol} />
                            }
                            color="dark"
                        />
                    </>
                )}

                {/* AMOUNT */}
                {(tx.targets.length || tx.type === 'joint') && (
                    <AmountRow
                        firstColumn={<Translation id="AMOUNT" />}
                        secondColumn={<FormattedCryptoAmount value={amount} symbol={tx.symbol} />}
                        thirdColumn={
                            !tx.tokens.length && (
                                <FiatValue
                                    amount={amount}
                                    symbol={tx.symbol}
                                    source={tx.rates}
                                    useCustomSource
                                />
                            )
                        }
                        fourthColumn={<FiatValue amount={amount} symbol={tx.symbol} />}
                        color="light"
                    />
                )}

                {cardanoWithdrawal && (
                    <AmountRow
                        firstColumn={<Translation id="TR_TX_WITHDRAWAL" />}
                        secondColumn={
                            <FormattedCryptoAmount value={cardanoWithdrawal} symbol={tx.symbol} />
                        }
                        thirdColumn={
                            !tx.tokens.length && (
                                <FiatValue
                                    amount={cardanoWithdrawal}
                                    symbol={tx.symbol}
                                    source={tx.rates}
                                    useCustomSource
                                />
                            )
                        }
                        fourthColumn={<FiatValue amount={cardanoWithdrawal} symbol={tx.symbol} />}
                        color="light"
                    />
                )}

                {cardanoDeposit && (
                    <AmountRow
                        firstColumn={<Translation id="TR_TX_DEPOSIT" />}
                        secondColumn={
                            <FormattedCryptoAmount value={cardanoDeposit} symbol={tx.symbol} />
                        }
                        thirdColumn={
                            !tx.tokens.length && (
                                <FiatValue
                                    amount={cardanoDeposit}
                                    symbol={tx.symbol}
                                    source={tx.rates}
                                    useCustomSource
                                />
                            )
                        }
                        fourthColumn={<FiatValue amount={cardanoDeposit} symbol={tx.symbol} />}
                        color="light"
                    />
                )}

                {tx.tokens.map((t, i) => (
                    <AmountRow
                        // eslint-disable-next-line react/no-array-index-key
                        key={i}
                        firstColumn={
                            !tx.targets.length && i === 0 ? <Translation id="AMOUNT" /> : undefined
                        }
                        secondColumn={
                            <FormattedCryptoAmount
                                value={formatAmount(t.amount, t.decimals)}
                                symbol={t.symbol as NetworkSymbol}
                            />
                        }
                        // no history rates available for tokens
                        thirdColumn={null}
                        fourthColumn={
                            <FiatValue
                                amount={formatAmount(t.amount, t.decimals)}
                                symbol={t.symbol}
                                tokenAddress={t.address}
                            />
                        }
                        color="light"
                    />
                ))}

                {/* TX FEE */}
                <AmountRow
                    firstColumn={<Translation id="TR_TX_FEE" />}
                    secondColumn={<FormattedCryptoAmount value={fee} symbol={tx.symbol} />}
                    thirdColumn={
                        <FiatValue
                            amount={fee}
                            symbol={tx.symbol}
                            source={tx.rates}
                            useCustomSource
                        />
                    }
                    fourthColumn={<FiatValue amount={fee} symbol={tx.symbol} />}
                    color="light"
                />
            </AmountWrapper>
        </MainContainer>
    );
};
