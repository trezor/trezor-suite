import { FormattedDate } from 'react-intl';
import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { Translation, FormattedCryptoAmount, FiatValue } from '@suite-components';
import AmountRow from '../AmountRow';
import { getDateWithTimeZone } from '@suite-utils/date';
import { WalletAccountTransaction } from '@wallet-types';
import { getNetwork } from '@wallet-utils/accountUtils';

// define these attributes as a constant because we will use the same values in two different styled components
const ROW_HEIGHT = '36px';
const GRID_GAP = '5px';

const MainContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const AmountWrapper = styled.div<{ showFiat: boolean }>`
    display: grid;
    grid-gap: ${GRID_GAP};

    /* columns: 1. title, 2. crypto amount, 3. fiat amount old, 4. fiat amount now */
    grid-template-columns: 140px minmax(110px, auto) minmax(100px, auto) minmax(100px, auto);

    /* render 4 or 5 rows based on the value of showFiat props. 
    If showFiat=true, we will display row with dates as well */
    grid-template-rows: ${props =>
        props.showFiat
            ? `repeat(5, minmax(${ROW_HEIGHT}, auto))`
            : `repeat(4, minmax(${ROW_HEIGHT}, auto))`};

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
    totalInput?: string;
    totalOutput?: string;
    // txDetails: any;
    isTestnet: boolean;
}
const AmountDetails = ({ tx, totalInput, totalOutput, isTestnet }: Props) => {
    const assetSymbol = tx.symbol.toUpperCase();
    const [showFiat, setShowFiat] = useState(false);
    const network = getNetwork(tx.symbol);
    const showTotalIO = network?.networkType === 'ripple' || network?.networkType === 'ethereum';

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

            <AmountWrapper showFiat={showFiat}>
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

                {!showTotalIO && (
                    <>
                        {/* TOTAL INPUT */}
                        <AmountRow
                            firstColumn={<Translation id="TR_TOTAL_INPUT" />}
                            secondColumn={
                                <FormattedCryptoAmount value={totalInput} symbol={assetSymbol} />
                            }
                            thirdColumn={
                                showFiat &&
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
                                <FormattedCryptoAmount value={totalOutput} symbol={assetSymbol} />
                            }
                            thirdColumn={
                                showFiat &&
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
                <AmountRow
                    firstColumn={<Translation id="AMOUNT" />}
                    secondColumn={<FormattedCryptoAmount value={tx.amount} symbol={assetSymbol} />}
                    thirdColumn={
                        showFiat && (
                            <FiatValue
                                amount={tx.amount}
                                symbol={tx.symbol}
                                source={tx.rates}
                                useCustomSource
                            />
                        )
                    }
                    fourthColumn={showFiat && <FiatValue amount={tx.amount} symbol={tx.symbol} />}
                    color="light"
                />

                {/* TX FEE */}
                <AmountRow
                    firstColumn={<Translation id="TR_TX_FEE" />}
                    secondColumn={<FormattedCryptoAmount value={tx.fee} symbol={assetSymbol} />}
                    thirdColumn={
                        showFiat && (
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
