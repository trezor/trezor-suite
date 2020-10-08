import { FormattedDate } from 'react-intl';
import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { Translation, FormattedCryptoAmount, FiatValue } from '@suite-components';
import AmountRow from '../AmountRow';
import { getDateWithTimeZone } from '@suite-utils/date';
import { WalletAccountTransaction } from '@wallet-types';
import { getNetwork, formatNetworkAmount } from '@wallet-utils/accountUtils';
import BigNumber from 'bignumber.js';

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
    overflow-x: auto; /* allow x-axis scrolling: useful on small screens when fiat amount is displayed */
    word-break: break-all;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        /* decrease the width of the first (title) column on small screen */
        grid-template-columns: 90px minmax(110px, auto) minmax(100px, auto) minmax(100px, auto);
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
    txDetails: any;
    isTestnet: boolean;
}
const AmountDetails = ({ tx, txDetails, isTestnet }: Props) => {
    const tokenTransfer = tx.tokens.length > 0 ? tx.tokens[0] : undefined;
    const amount = tokenTransfer ? tokenTransfer.amount : tx.amount;
    const assetSymbol = tokenTransfer
        ? tokenTransfer.symbol.toUpperCase()
        : tx.symbol.toUpperCase();

    const [showFiat, setShowFiat] = useState(false);
    const network = getNetwork(tx.symbol);
    const hideTotalIORows =
        network?.networkType === 'ripple' || network?.networkType === 'ethereum';

    const showHistoricalRates = showFiat && !tokenTransfer;

    // sum of all inputs
    const totalInput: BigNumber | undefined = txDetails?.vin?.reduce(
        (acc: BigNumber, input: any) => acc.plus(input.value),
        new BigNumber('0'),
    );

    // sum of all outputs
    const totalOutput: BigNumber | undefined = txDetails?.vout?.reduce(
        (acc: BigNumber, output: any) => acc.plus(output.value ?? 0),
        new BigNumber('0'),
    );

    // formatNetworkAmount returns "-1" in case of an error, thus can't be used in reduce above
    const formattedTotalInput =
        totalInput && !totalInput.isNaN()
            ? formatNetworkAmount(totalInput.toFixed(), tx.symbol)
            : undefined;
    const formattedTotalOutput =
        totalOutput && !totalOutput.isNaN()
            ? formatNetworkAmount(totalOutput.toFixed(), tx.symbol)
            : undefined;

    return (
        <MainContainer>
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
                {/* DATES FOR FIAT VALUES */}
                {showFiat && (
                    <AmountRow
                        // keep the first two columns empty for the first row
                        thirdColumn={
                            tx.blockTime && (
                                <FormattedDate
                                    value={getDateWithTimeZone(tx.blockTime * 1000)}
                                    year="numeric"
                                    month="short"
                                    day="2-digit"
                                />
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
                                                        month="short"
                                                        day="2-digit"
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
                                    value={formattedTotalInput}
                                    symbol={assetSymbol}
                                />
                            }
                            thirdColumn={
                                showHistoricalRates &&
                                formattedTotalInput && (
                                    <FiatValue
                                        amount={formattedTotalInput}
                                        symbol={tx.symbol}
                                        source={tx.rates}
                                        useCustomSource
                                    />
                                )
                            }
                            fourthColumn={
                                showFiat &&
                                formattedTotalInput && (
                                    <FiatValue amount={formattedTotalInput} symbol={tx.symbol} />
                                )
                            }
                            color="dark"
                        />

                        {/* TOTAL OUTPUT */}
                        <AmountRow
                            firstColumn={<Translation id="TR_TOTAL_OUTPUT" />}
                            secondColumn={
                                <FormattedCryptoAmount
                                    value={formattedTotalOutput}
                                    symbol={tx.symbol}
                                />
                            }
                            thirdColumn={
                                showHistoricalRates &&
                                formattedTotalOutput && (
                                    <FiatValue
                                        amount={formattedTotalOutput}
                                        symbol={tx.symbol}
                                        source={tx.rates}
                                        useCustomSource
                                    />
                                )
                            }
                            fourthColumn={
                                showFiat &&
                                formattedTotalOutput && (
                                    <FiatValue amount={formattedTotalOutput} symbol={tx.symbol} />
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
                    fourthColumn={showFiat && <FiatValue amount={amount} symbol={assetSymbol} />}
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
                {/* TODO: BlockchainLink doesn't return size/vsize field */}
                {/* {txDetails?.size && <BoxRow title="Size">{`${txDetails.size} B`}</BoxRow>} */}
            </AmountWrapper>
        </MainContainer>
    );
};

export default AmountDetails;
