import React, { useState } from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { Icon, colors, variables, Link, Loader, Tooltip, Button } from '@trezor/components';
import { Translation, HiddenPlaceholder } from '@suite-components';
import Box from '../Box';
import BoxRow from '../BoxRow';
import AmountRow from '../AmountRow';
import { getDateWithTimeZone } from '@suite-utils/date';
import { WalletAccountTransaction } from '@wallet-types';
import FormattedCryptoAmount from '@suite/components/suite/FormattedCryptoAmount';
import FiatValue from '@suite-components/FiatValue/Container';
import { isTestnet, getNetwork } from '@wallet-utils/accountUtils';

const AmountWrapper = styled.div`
    // display: grid;
    // grid-gap: 20px;
    // grid-template-columns: 1fr 2fr 1fr 1fr;
    // align-items: center;
`;

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
            {/* first row with "showFiat button" */}
            {!showFiat && (
                <AmountRow
                    firstColumn={<div />}
                    secondColumn={<div />}
                    thirdColumn={<div />}
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

            {/* second row with dates */}
            {showFiat && (
                <AmountRow
                    // keep the first two columns empty for the first row
                    firstColumn={<div />}
                    secondColumn={<div />}
                    thirdColumn={
                        tx.blockTime && (
                            <FormattedDate
                                value={getDateWithTimeZone(tx.blockTime * 1000)}
                                year="numeric"
                                month="2-digit"
                                day="2-digit"
                            />
                        )
                    }
                    fourthColumn={
                        <FiatValue amount="1" symbol={tx.symbol}>
                            {({ timestamp }) =>
                                timestamp ? (
                                    <FormattedDate
                                        value={timestamp}
                                        year="numeric"
                                        month="2-digit"
                                        day="2-digit"
                                    />
                                ) : null
                            }
                        </FiatValue>
                    }
                    color="light"
                />
            )}

            {/* TOTAL INPUT ROW */}
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
                    showFiat && totalOutput && <FiatValue amount={totalInput} symbol={tx.symbol} />
                }
                color="dark"
            />

            {/* TOTAL OUPUT ROW */}
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

            {/* AMOUNT ROW */}
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

            {/* TX FEE ROW */}
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
