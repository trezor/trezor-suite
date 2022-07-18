import React from 'react';
import { FormattedDate } from 'react-intl';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { variables } from '@trezor/components';
import {
    Translation,
    HiddenPlaceholder,
    FormattedCryptoAmount,
    FormattedFiatAmount,
} from '@suite-components';
import { parseKey } from '@wallet-utils/transactionUtils';
import { isTestnet } from '@wallet-utils/accountUtils';
import { Network } from '@wallet-types';
import { SECONDARY_PANEL_HEIGHT } from '@suite-components/AppNavigation';

const Wrapper = styled.div`
    display: flex;
    position: sticky;
    background: ${props => props.theme.BG_GREY};
    top: ${SECONDARY_PANEL_HEIGHT};
    align-items: center;
    justify-content: space-between;
    flex: 1;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 24px;
`;

const Col = styled(HiddenPlaceholder)`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
`;

const ColDate = styled(Col)`
    font-variant-numeric: tabular-nums;
    flex: 1;
`;

const ColPending = styled(Col)`
    color: ${props => props.theme.TYPE_ORANGE};
    font-variant-numeric: tabular-nums;
`;

const ColAmount = styled(Col)`
    padding-left: 16px;
    text-align: right;
`;

const ColFiat = styled(Col)`
    padding-left: 16px;
    text-align: right;
`;

interface Props {
    dateKey: string;
    symbol: Network['symbol'];
    totalAmount: BigNumber;
    totalFiatAmountPerDay: BigNumber;
    localCurrency: string;
    txsCount?: number;
    isHovered?: boolean;
}

const DayHeader = ({
    dateKey,
    symbol,
    totalAmount,
    totalFiatAmountPerDay,
    localCurrency,
    txsCount,
    isHovered,
}: Props) => {
    const parsedDate = parseKey(dateKey);
    const showFiatValue = !isTestnet(symbol);
    return (
        <Wrapper>
            {dateKey === 'pending' ? (
                <ColPending>
                    <Translation id="TR_PENDING_TX_HEADING" values={{ count: txsCount }} /> •{' '}
                    {txsCount}
                </ColPending>
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
                    {isHovered && (
                        <ColAmount>
                            {totalAmount.gte(0) && <span>+</span>}
                            <FormattedCryptoAmount value={totalAmount.toFixed()} symbol={symbol} />
                        </ColAmount>
                    )}
                    {showFiatValue && (
                        <ColFiat>
                            <HiddenPlaceholder>
                                {/* {<>≈ </>} */}
                                {totalFiatAmountPerDay.gte(0) && <span>+</span>}
                                <FormattedFiatAmount
                                    currency={localCurrency}
                                    value={totalFiatAmountPerDay.toFixed()}
                                />
                            </HiddenPlaceholder>
                        </ColFiat>
                    )}
                </>
            )}
        </Wrapper>
    );
};

export default DayHeader;
