import React from 'react';
import { FormattedDate } from 'react-intl';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { variables, colors } from '@trezor/components';
import { Translation, HiddenPlaceholder, FiatValue } from '@suite-components';
import { parseKey } from '@wallet-utils/transactionUtils';
import { isTestnet } from '@wallet-utils/accountUtils';
import { Network } from '@wallet-types';

const Col = styled(HiddenPlaceholder)`
    position: sticky;
    z-index: 1;
    top: 0;
    font-size: ${variables.FONT_SIZE.TINY};
    padding: 20px 0px;
    color: ${colors.BLACK50};
    border-bottom: 2px solid ${colors.BLACK96};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    background: ${colors.WHITE};
`;

const ColDate = styled(Col)`
    grid-column: date / target;
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: date / target;
        border: 0px;
        padding-bottom: 8px;
    }
`;

const ColAmount = styled(Col)`
    grid-column: amount;
    text-align: right;
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding-top: 8px; /* grid-row-gap */
        grid-column: date / amount;
        top: 43px; /* date height */
        text-align: left;
    }
`;

const ColFiat = styled(Col)`
    grid-column: fiat;
    padding-left: 16px;
    text-align: right;
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding-top: 8px; /* grid-row-gap */
        top: 43px; /* date height */
    }
`;

interface Props {
    dateKey: string;
    symbol: Network['symbol'];
    totalAmount: BigNumber;
}

export default ({ dateKey, symbol, totalAmount }: Props) => {
    const parsedDate = parseKey(dateKey);
    const useFiatValues = !isTestnet(symbol);
    return (
        <>
            {dateKey === 'pending' ? (
                <ColDate>
                    <Translation id="TR_PENDING" />
                </ColDate>
            ) : (
                <>
                    <ColDate>
                        <FormattedDate
                            value={parsedDate ?? undefined}
                            day="numeric"
                            month="long"
                            year="numeric"
                        />
                    </ColDate>
                    <ColAmount>
                        {totalAmount.gte(0) && '+'}
                        {totalAmount.toFixed()} {symbol}
                    </ColAmount>
                    {useFiatValues && (
                        <ColFiat>
                            <FiatValue amount={totalAmount.toFixed()} symbol={symbol}>
                                {({ value }) => value && <>{value}</>}
                            </FiatValue>
                        </ColFiat>
                    )}
                </>
            )}
        </>
    );
};
