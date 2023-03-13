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
    getTxOperation,
} from '@suite-common/wallet-utils';
import BigNumber from 'bignumber.js';

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
    const amount = new BigNumber(formatNetworkAmount(tx.amount, tx.symbol));
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
                                <FormattedCryptoAmount
                                    value={totalOutput}
                                    symbol={tx.symbol}
                                    signValue={getTxOperation(tx, true)}
                                />
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
                        secondColumn={
                            <FormattedCryptoAmount
                                value={amount.abs().toString()}
                                symbol={tx.symbol}
                                signValue={
                                    getTxOperation(tx.type, true) || amount.isLessThan(0)
                                        ? 'negative'
                                        : 'positive'
                                }
                            />
                        }
                        thirdColumn={
                            !tx.tokens.length && (
                                <FiatValue
                                    amount={amount.abs().toString()}
                                    symbol={tx.symbol}
                                    source={tx.rates}
                                    useCustomSource
                                />
                            )
                        }
                        fourthColumn={
                            <FiatValue amount={amount.abs().toString()} symbol={tx.symbol} />
                        }
                        color="light"
                    />
                )}

                {cardanoWithdrawal && (
                    <AmountRow
                        firstColumn={<Translation id="TR_TX_WITHDRAWAL" />}
                        secondColumn={
                            <FormattedCryptoAmount
                                value={cardanoWithdrawal}
                                symbol={tx.symbol}
                                signValue="negative"
                            />
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
                            <FormattedCryptoAmount
                                value={cardanoDeposit}
                                symbol={tx.symbol}
                                signValue="positive"
                            />
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

                {tx.internalTransfers.map((t, i) => (
                    <AmountRow
                        // eslint-disable-next-line react/no-array-index-key
                        key={i}
                        firstColumn={
                            !tx.targets.length && i === 0 ? <Translation id="AMOUNT" /> : undefined
                        }
                        secondColumn={
                            <FormattedCryptoAmount
                                value={formatNetworkAmount(t.amount, tx.symbol)}
                                symbol={tx.symbol}
                                signValue={getTxOperation(transfer.type, true)}
                            />
                        }
                        thirdColumn={
                            !tx.tokens.length && (
                                <FiatValue
                                    amount={formatNetworkAmount(t.amount, tx.symbol)}
                                    symbol={tx.symbol}
                                    source={tx.rates}
                                    useCustomSource
                                />
                            )
                        }
                        fourthColumn={
                            <FiatValue
                                amount={formatNetworkAmount(t.amount, tx.symbol)}
                                symbol={tx.symbol}
                            />
                        }
                        color="light"
                    />
                ))}

                {tx.tokens.map((t, i) => (
                    <AmountRow
                        // eslint-disable-next-line react/no-array-index-key
                        key={i}
                        firstColumn={
                            !tx.targets.length && !tx.internalTransfers.length && i === 0 ? (
                                <Translation id="AMOUNT" />
                            ) : undefined
                        }
                        secondColumn={
                            isNftTokenTransfer(transfer) ? (
                                <FormattedNftAmount
                                    transfer={transfer}
                                    isWithLink
                                    signValue={getTxOperation(transfer.type, true)}
                                />
                            ) : (
                                <FormattedCryptoAmount
                                    value={formatAmount(transfer.amount, transfer.decimals)}
                                    symbol={transfer.symbol as NetworkSymbol}
                                    signValue={getTxOperation(transfer.type, true)}
                                />
                            )
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
                {tx.type !== 'recv' && (
                    <AmountRow
                        firstColumn={<Translation id="TR_TX_FEE" />}
                        secondColumn={
                            <FormattedCryptoAmount
                                value={fee}
                                symbol={tx.symbol}
                                signValue="negative"
                            />
                        }
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
                )}
            </AmountWrapper>
        </MainContainer>
    );
};
