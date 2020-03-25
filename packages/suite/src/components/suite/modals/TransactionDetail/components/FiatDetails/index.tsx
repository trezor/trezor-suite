import React from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import FiatValue from '@suite-components/FiatValue/Container';
import Badge from '@suite-components/Badge';
import { Translation, HiddenPlaceholder } from '@suite-components';

import Box from '../Box';
import BoxRow from '../BoxRow';
import { FormattedDate } from 'react-intl';
import NoRatesTooltip from '@suite/components/suite/NoRatesTooltip';
import { getDateWithTimeZone } from '@suite-utils/date';
import { WalletAccountTransaction } from '@wallet-types';

const Grid = styled.div`
    display: grid;
    grid-gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;

const BoxHeading = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0px 12px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.BLACK50};
    margin-bottom: 10px;
`;

const HistoricalBadge = styled(Badge)`
    background: #b3b3b3;
    color: white;
`;

const Col = styled.div<{ direction: 'column' | 'row' }>`
    display: flex;
    flex-direction: ${props => props.direction};
    flex: 1 1 auto;
`;

interface Props {
    tx: WalletAccountTransaction;
    totalOutput?: string;
}

const FiatDetails = ({ tx, totalOutput }: Props) => {
    return (
        <Grid>
            <Col direction="column">
                <BoxHeading>
                    <Translation id="TR_TX_CURRENT_VALUE" />{' '}
                    {/* such a weird syntax, but basically all I want is show date in parentheses: (formattedDate) */}
                    <FiatValue amount="1" symbol={tx.symbol}>
                        {({ timestamp }) => (
                            <>
                                {timestamp && (
                                    <>
                                        (
                                        <FormattedDate
                                            value={timestamp}
                                            year="numeric"
                                            month="2-digit"
                                            day="2-digit"
                                        />
                                        )
                                    </>
                                )}
                            </>
                        )}
                    </FiatValue>
                    <FiatValue amount="1" symbol={tx.symbol}>
                        {({ value }) => (value ? <Badge>{value}</Badge> : <NoRatesTooltip />)}
                    </FiatValue>
                </BoxHeading>
                <Box>
                    <BoxRow title={<Translation id="TR_TOTAL_OUTPUT" />} alignContent="right">
                        {totalOutput && (
                            <HiddenPlaceholder>
                                <FiatValue amount={totalOutput} symbol={tx.symbol}>
                                    {({ value }) => value ?? null}
                                </FiatValue>
                            </HiddenPlaceholder>
                        )}
                    </BoxRow>
                    <BoxRow title={<Translation id="TR_AMOUNT" />} alignContent="right">
                        <HiddenPlaceholder>
                            <FiatValue amount={tx.amount} symbol={tx.symbol}>
                                {({ value }) => value ?? null}
                            </FiatValue>
                        </HiddenPlaceholder>
                    </BoxRow>
                    <BoxRow title={<Translation id="TR_TX_FEE" />} alignContent="right">
                        <HiddenPlaceholder>
                            <FiatValue amount={tx.fee} symbol={tx.symbol}>
                                {({ value }) => value ?? null}
                            </FiatValue>
                        </HiddenPlaceholder>
                    </BoxRow>
                </Box>
            </Col>
            <Col direction="column">
                <BoxHeading>
                    <Translation
                        id="TR_TX_HISTORICAL_VALUE_DATE"
                        values={{
                            date: tx.blockTime ? (
                                <FormattedDate
                                    value={getDateWithTimeZone(tx.blockTime * 1000) ?? undefined}
                                    year="numeric"
                                    month="2-digit"
                                    day="2-digit"
                                />
                            ) : (
                                ''
                            ),
                        }}
                    />

                    <FiatValue amount="1" symbol={tx.symbol} source={tx.rates} useCustomSource>
                        {({ value }) =>
                            value ? <HistoricalBadge>{value}</HistoricalBadge> : <NoRatesTooltip />
                        }
                    </FiatValue>
                </BoxHeading>
                <Box>
                    <BoxRow title={<Translation id="TR_TOTAL_OUTPUT" />} alignContent="right">
                        {totalOutput && (
                            <HiddenPlaceholder>
                                <FiatValue
                                    amount={totalOutput}
                                    symbol={tx.symbol}
                                    source={tx.rates}
                                    useCustomSource
                                >
                                    {({ value }) => value ?? null}
                                </FiatValue>
                            </HiddenPlaceholder>
                        )}
                    </BoxRow>
                    <BoxRow title={<Translation id="TR_AMOUNT" />} alignContent="right">
                        <HiddenPlaceholder>
                            <FiatValue
                                amount={tx.amount}
                                symbol={tx.symbol}
                                source={tx.rates}
                                useCustomSource
                            >
                                {({ value }) => value ?? null}
                            </FiatValue>
                        </HiddenPlaceholder>
                    </BoxRow>
                    <BoxRow title={<Translation id="TR_TX_FEE" />} alignContent="right">
                        <HiddenPlaceholder>
                            <FiatValue
                                amount={tx.fee}
                                symbol={tx.symbol}
                                source={tx.rates}
                                useCustomSource
                            >
                                {({ value }) => value ?? null}
                            </FiatValue>
                        </HiddenPlaceholder>
                    </BoxRow>
                </Box>
            </Col>
        </Grid>
    );
};

export default FiatDetails;
