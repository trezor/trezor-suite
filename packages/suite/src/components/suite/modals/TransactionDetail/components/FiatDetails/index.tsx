import React from 'react';
import styled, { css } from 'styled-components';
import { colors, variables } from '@trezor/components';
import FiatValue from '@suite-components/FiatValue/Container';
import Badge from '@suite-components/Badge';
import { Translation, HiddenPlaceholder } from '@suite-components';

import Box from '../Box';
import { FormattedDate } from 'react-intl';
import NoRatesTooltip from '@suite/components/suite/NoRatesTooltip';
import { getDateWithTimeZone } from '@suite-utils/date';
import { WalletAccountTransaction } from '@wallet-types';

const Grid = styled.div`
    display: grid;
    /* grid-gap: 20px; */
    grid-template-columns: 3fr 1fr 1fr;
`;

interface ItemProps {
    heading?: boolean;
    allCaps?: boolean;
    alignContent?: 'left' | 'right';
}

const Item = styled.div<ItemProps>`
    display: flex;
    overflow: hidden;   
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: #444;
    padding: 10px 12px;
    border-top: 1px solid #ccc;
    font-variant-numeric: tabular-nums;

    ${props =>
        props.alignContent &&
        css`
            text-align: ${(props: ItemProps) => props.alignContent};
            justify-content: ${(props: ItemProps) =>
                props.alignContent === 'left' ? 'flex-start' : 'flex-end'};
        `}

    ${props =>
        props.heading &&
        css`
            color: #807f7f;
            border: none;
            background: ${colors.BLACK96};
        `}

    ${props =>
        props.allCaps &&
        css`
            color: #807f7f;
            text-transform: uppercase;
        `}
`;

interface Props {
    tx: WalletAccountTransaction;
    totalOutput?: string;
}

const FiatDetails = ({ tx, totalOutput }: Props) => {
    return (
        <Box>
            <Grid>
                <Item heading allCaps>
                    Fiat conversion
                </Item>
                <Item heading alignContent="right">
                    {tx.blockTime && (
                        <FormattedDate
                            value={getDateWithTimeZone(tx.blockTime * 1000)}
                            year="numeric"
                            month="2-digit"
                            day="2-digit"
                        />
                    )}
                </Item>
                <Item heading alignContent="right">
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
                </Item>

                <Item allCaps>
                    <Translation id="AMOUNT" />
                </Item>
                <Item alignContent="right">
                    <HiddenPlaceholder>
                        <FiatValue
                            amount={tx.amount}
                            symbol={tx.symbol}
                            source={tx.rates}
                            useCustomSource
                        >
                            {({ value }) => <Badge isGray>{value}</Badge> || <NoRatesTooltip />}
                        </FiatValue>
                    </HiddenPlaceholder>
                </Item>
                <Item alignContent="right">
                    <FiatValue amount={tx.amount} symbol={tx.symbol} badge={{ color: 'blue' }} />
                </Item>
                <Item allCaps>
                    <Translation id="TR_TOTAL_OUTPUT" />
                </Item>
                <Item alignContent="right">
                    {totalOutput && (
                        <FiatValue
                            amount={totalOutput}
                            symbol={tx.symbol}
                            source={tx.rates}
                            badge={{ color: 'gray' }}
                            useCustomSource
                        />
                    )}
                </Item>
                <Item alignContent="right">
                    {totalOutput && (
                        <FiatValue
                            amount={totalOutput}
                            symbol={tx.symbol}
                            badge={{ color: 'blue' }}
                        />
                    )}
                </Item>
                <Item allCaps>
                    <Translation id="TR_TX_FEE" />
                </Item>
                <Item alignContent="right">
                    <FiatValue
                        amount={tx.fee}
                        symbol={tx.symbol}
                        source={tx.rates}
                        badge={{ color: 'gray' }}
                        useCustomSource
                    />
                </Item>
                <Item alignContent="right">
                    <HiddenPlaceholder>
                        <FiatValue amount={tx.fee} symbol={tx.symbol} badge={{ color: 'blue' }} />
                    </HiddenPlaceholder>
                </Item>
            </Grid>
        </Box>
    );
};

export default FiatDetails;
