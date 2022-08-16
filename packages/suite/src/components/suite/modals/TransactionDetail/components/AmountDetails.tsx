import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { Translation, FormattedCryptoAmount, FiatValue, FormattedDate } from '@suite-components';
import { AmountRow } from './AmountRow';
import { NetworkSymbol, WalletAccountTransaction } from '@wallet-types';
import {
    formatAmount,
    formatCardanoDeposit,
    formatCardanoWithdrawal,
    formatNetworkAmount,
    getNetwork,
} from '@suite-common/wallet-utils';

// define these attributes as a constant because we will use the same values in two different styled components
const ROW_HEIGHT = '36px';
const GRID_GAP = '5px';

const MainContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const AmountWrapper = styled.div`
    display: grid;
    grid-gap: ${GRID_GAP};

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

const ShowFiatButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;

    /* NOTE about the following two properties:
    It's important to use the same values as in <AmountWrapper> because we want the height of
    <ShowFiatButtonWrapper> to be the same as the height of a row in <AmountWrapper>. This is because we don't want to component
    jump in height when we click "show fiat" button (the button is replaced with dates) */
    height: ${ROW_HEIGHT};
    margin-bottom: ${GRID_GAP};
`;

interface AmountDetailsProps {
    tx: WalletAccountTransaction;
    isTestnet: boolean;
}

export const AmountDetails = ({ tx, isTestnet }: AmountDetailsProps) => {
    const [showFiat, setShowFiat] = useState(false);

    const tokenTransfer = tx.tokens.length > 0 ? tx.tokens[0] : undefined;
    const amount = tokenTransfer
        ? formatAmount(tokenTransfer.amount, tokenTransfer.decimals)
        : tx.amount;
    const assetSymbol = tokenTransfer ? tokenTransfer.symbol : tx.symbol;

    const network = getNetwork(tx.symbol);
    const hideTotalIORows =
        network?.networkType === 'ripple' || network?.networkType === 'ethereum'; // don't show for eth, xrp

    const showHistoricalRates = showFiat && !tokenTransfer;
    const totalInput = formatNetworkAmount(tx.details.totalInput, tx.symbol);
    const totalOutput = formatNetworkAmount(tx.details.totalOutput, tx.symbol);
    const fee = formatNetworkAmount(tx.fee, tx.symbol);
    const cardanoWithdrawal = formatCardanoWithdrawal(tx);
    const cardanoDeposit = formatCardanoDeposit(tx);

    return (
        <MainContainer>
            {/* ROW CONTAINING "SHOW FIAT" BUTTON */}
            {!showFiat && !isTestnet && (
                <ShowFiatButtonWrapper>
                    <Button
                        variant="tertiary"
                        onClick={() => {
                            setShowFiat(true);
                        }}
                    >
                        <Translation id="TR_SHOW_FIAT" />
                    </Button>
                </ShowFiatButtonWrapper>
            )}

            <AmountWrapper>
                {/* ROW CONTAINING DATES FOR FIAT VALUES */}
                {showFiat && (
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

                {!hideTotalIORows && (
                    <>
                        {/* TOTAL INPUT */}
                        <AmountRow
                            firstColumn={<Translation id="TR_TOTAL_INPUT" />}
                            secondColumn={
                                <FormattedCryptoAmount value={totalInput} symbol={tx.symbol} />
                            }
                            thirdColumn={
                                showHistoricalRates &&
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
                                showFiat &&
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
                                showHistoricalRates &&
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
                                showFiat &&
                                totalOutput && <FiatValue amount={totalOutput} symbol={tx.symbol} />
                            }
                            color="dark"
                        />
                    </>
                )}

                {/* AMOUNT */}
                {tx.targets.length > 0 && (
                    <AmountRow
                        firstColumn={<Translation id="AMOUNT" />}
                        secondColumn={
                            <FormattedCryptoAmount value={tx.amount} symbol={tx.symbol} />
                        }
                        thirdColumn={
                            showHistoricalRates && (
                                <FiatValue
                                    amount={amount}
                                    symbol={assetSymbol}
                                    source={tx.rates}
                                    useCustomSource
                                />
                            )
                        }
                        fourthColumn={
                            showFiat && (
                                <FiatValue
                                    amount={amount}
                                    symbol={assetSymbol}
                                    tokenAddress={tokenTransfer?.address}
                                />
                            )
                        }
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
                            showHistoricalRates && (
                                <FiatValue
                                    amount={cardanoWithdrawal}
                                    symbol={tx.symbol}
                                    source={tx.rates}
                                    useCustomSource
                                />
                            )
                        }
                        fourthColumn={
                            showFiat && <FiatValue amount={cardanoWithdrawal} symbol={tx.symbol} />
                        }
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
                            showHistoricalRates && (
                                <FiatValue
                                    amount={cardanoDeposit}
                                    symbol={tx.symbol}
                                    source={tx.rates}
                                    useCustomSource
                                />
                            )
                        }
                        fourthColumn={
                            showFiat && <FiatValue amount={cardanoDeposit} symbol={tx.symbol} />
                        }
                        color="light"
                    />
                )}

                {tx.tokens.map((t, i) => (
                    <AmountRow
                        // eslint-disable-next-line react/no-array-index-key
                        key={i}
                        firstColumn={
                            tx.targets.length === 0 ? <Translation id="AMOUNT" /> : undefined
                        }
                        secondColumn={
                            <FormattedCryptoAmount
                                value={formatAmount(t.amount, t.decimals)}
                                symbol={t.symbol as NetworkSymbol}
                            />
                        }
                        thirdColumn={
                            showHistoricalRates && (
                                <FiatValue
                                    amount={amount}
                                    symbol={assetSymbol}
                                    source={tx.rates}
                                    useCustomSource
                                />
                            )
                        }
                        fourthColumn={
                            showFiat && (
                                <FiatValue
                                    amount={amount}
                                    symbol={assetSymbol}
                                    tokenAddress={tokenTransfer?.address}
                                />
                            )
                        }
                        color="light"
                    />
                ))}

                {/* TX FEE */}
                <AmountRow
                    firstColumn={<Translation id="TR_TX_FEE" />}
                    secondColumn={<FormattedCryptoAmount value={fee} symbol={tx.symbol} />}
                    thirdColumn={
                        showHistoricalRates && (
                            <FiatValue
                                amount={fee}
                                symbol={tx.symbol}
                                source={tx.rates}
                                useCustomSource
                            />
                        )
                    }
                    fourthColumn={showFiat && <FiatValue amount={fee} symbol={tx.symbol} />}
                    color="light"
                />
            </AmountWrapper>
        </MainContainer>
    );
};
