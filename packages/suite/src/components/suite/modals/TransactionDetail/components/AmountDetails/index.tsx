import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { Translation, FormattedCryptoAmount, FiatValue, FormattedDate } from '@suite-components';
import AmountRow from '../AmountRow';
import { WalletAccountTransaction } from '@wallet-types';
import { getNetwork } from '@wallet-utils/accountUtils';

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

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
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

interface Props {
    tx: WalletAccountTransaction;
    isTestnet: boolean;
}
const AmountDetails = ({ tx, isTestnet }: Props) => {
    const tokenTransfer = tx.tokens.length > 0 ? tx.tokens[0] : undefined;
    const amount = tokenTransfer ? tokenTransfer.amount : tx.amount;
    const assetSymbol = tokenTransfer ? tokenTransfer.symbol : tx.symbol;

    const [showFiat, setShowFiat] = useState(false);
    const network = getNetwork(tx.symbol);
    const hideTotalIORows =
        network?.networkType === 'ripple' || network?.networkType === 'ethereum'; // don't show for eth, xrp

    const showHistoricalRates = showFiat && !tokenTransfer;

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
                                <FormattedCryptoAmount
                                    value={tx.details.totalInput}
                                    symbol={assetSymbol}
                                />
                            }
                            thirdColumn={
                                showHistoricalRates &&
                                tx.details.totalInput && (
                                    <FiatValue
                                        amount={tx.details.totalInput}
                                        symbol={tx.symbol}
                                        source={tx.rates}
                                        useCustomSource
                                    />
                                )
                            }
                            fourthColumn={
                                showFiat &&
                                tx.details.totalInput && (
                                    <FiatValue amount={tx.details.totalInput} symbol={tx.symbol} />
                                )
                            }
                            color="dark"
                        />

                        {/* TOTAL OUTPUT */}
                        <AmountRow
                            firstColumn={<Translation id="TR_TOTAL_OUTPUT" />}
                            secondColumn={
                                <FormattedCryptoAmount
                                    value={tx.details.totalOutput}
                                    symbol={tx.symbol}
                                />
                            }
                            thirdColumn={
                                showHistoricalRates &&
                                tx.details.totalOutput && (
                                    <FiatValue
                                        amount={tx.details.totalOutput}
                                        symbol={tx.symbol}
                                        source={tx.rates}
                                        useCustomSource
                                    />
                                )
                            }
                            fourthColumn={
                                showFiat &&
                                tx.details.totalOutput && (
                                    <FiatValue amount={tx.details.totalOutput} symbol={tx.symbol} />
                                )
                            }
                            color="dark"
                        />
                    </>
                )}
                {/* AMOUNT */}
                <AmountRow
                    firstColumn={<Translation id="AMOUNT" />}
                    secondColumn={<FormattedCryptoAmount value={amount} symbol={assetSymbol} />}
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
                {/* TX FEE */}
                <AmountRow
                    firstColumn={<Translation id="TR_TX_FEE" />}
                    secondColumn={<FormattedCryptoAmount value={tx.fee} symbol={tx.symbol} />}
                    thirdColumn={
                        showHistoricalRates && (
                            <FiatValue
                                amount={tx.fee}
                                symbol={tx.symbol}
                                source={tx.rates}
                                useCustomSource
                            />
                        )
                    }
                    fourthColumn={showFiat && <FiatValue amount={tx.fee} symbol={tx.symbol} />}
                    color="light"
                />
            </AmountWrapper>
        </MainContainer>
    );
};

export default AmountDetails;
