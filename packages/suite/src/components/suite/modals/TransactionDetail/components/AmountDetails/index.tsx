import React, { useState } from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { Button } from '@trezor/components';
import { Translation } from '@suite-components';
import AmountRow from '../AmountRow';
import { getDateWithTimeZone } from '@suite-utils/date';
import { WalletAccountTransaction } from '@wallet-types';
import FormattedCryptoAmount from '@suite/components/suite/FormattedCryptoAmount';
import FiatValue from '@suite-components/FiatValue/Container';

const AmountWrapper = styled.div``;

// TODO check if all props are necessary
interface Props {
    tx: WalletAccountTransaction;
    totalInput?: string;
    totalOutput?: string;
    txDetails: any;
    isFetching: boolean;
    isTestnet: boolean;
}

const AmountDetails = ({ tx, totalInput, totalOutput, isTestnet }: Props) => {
    const assetSymbol = tx.symbol.toUpperCase();
    const [showFiat, setShowFiat] = useState(false);

    return (
        <AmountWrapper>
            {/* row containing SHOW FIAT BUTTON. Don't show the button is fiat is diplayed already, or if testnet account is selected */}
            {!showFiat && !isTestnet && (
                <AmountRow
                    fourthColumn={
                        <Button
                            variant="tertiary"
                            onClick={() => {
                                setShowFiat(true);
                            }}
                        >
                            Show FIAT
                        </Button>
                    }
                    color="light"
                />
            )}

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
                        <div>
                            Today,{' '}
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
                        </div>
                    }
                    color="light"
                />
            )}

            {/* TOTAL INPUT */}
            {totalInput && (
                <AmountRow
                    firstColumn={<Translation id="TR_TOTAL_INPUT" />}
                    secondColumn={<FormattedCryptoAmount value={totalInput} symbol={assetSymbol} />}
                    thirdColumn={
                        showFiat &&
                        totalOutput && (
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
                        totalOutput && <FiatValue amount={totalInput} symbol={tx.symbol} />
                    }
                    color="dark"
                />
            )}

            {/* TOTAL OUPUT */}
            <AmountRow
                firstColumn={<Translation id="TR_TOTAL_OUTPUT" />}
                secondColumn={<FormattedCryptoAmount value={totalOutput} symbol={assetSymbol} />}
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
                    showFiat && totalOutput && <FiatValue amount={totalOutput} symbol={tx.symbol} />
                }
                color="dark"
            />

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
    );
};

export default AmountDetails;
