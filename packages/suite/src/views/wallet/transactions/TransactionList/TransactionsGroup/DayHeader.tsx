import { FormattedDate } from 'react-intl';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';

import { variables } from '@trezor/components';
import { zIndices } from '@trezor/theme';
import { useFormatters } from '@suite-common/formatters';
import { parseTransactionDateKey, isTestnet } from '@suite-common/wallet-utils';

import { Translation, HiddenPlaceholder, FormattedCryptoAmount } from 'src/components/suite';
import { Network } from 'src/types/wallet';
import { SUBPAGE_NAV_HEIGHT } from 'src/constants/suite/layout';

const Wrapper = styled.div`
    display: flex;
    position: sticky;
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    top: ${SUBPAGE_NAV_HEIGHT};
    align-items: center;
    justify-content: space-between;
    flex: 1;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 24px;
    z-index: ${zIndices.secondaryStickyBar};
`;

const Col = styled(HiddenPlaceholder)`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const ColDate = styled(Col)`
    font-variant-numeric: tabular-nums;
    flex: 1;
`;

const ColPending = styled(Col)`
    color: ${({ theme }) => theme.TYPE_ORANGE};
    font-variant-numeric: tabular-nums;
`;

const ColAmount = styled(Col)<{ isVisible?: boolean }>`
    padding-left: 16px;
    text-align: right;
    opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
    transition: opacity 0.1s;
`;

const ColFiat = styled(Col)`
    padding-left: 16px;
    text-align: right;
`;

interface DayHeaderProps {
    dateKey: string;
    symbol: Network['symbol'];
    totalAmount: BigNumber;
    totalFiatAmountPerDay: BigNumber;
    localCurrency: string;
    txsCount?: number;
    isMissingFiatRates?: boolean;
    isHovered?: boolean;
}

// TODO: Do not show FEE for sent but not mine transactions
export const DayHeader = ({
    dateKey,
    symbol,
    totalAmount,
    totalFiatAmountPerDay,
    localCurrency,
    txsCount,
    isMissingFiatRates,
    isHovered,
}: DayHeaderProps) => {
    const { FiatAmountFormatter } = useFormatters();

    const parsedDate = parseTransactionDateKey(dateKey);
    const showFiatValue = !isTestnet(symbol);

    return (
        <Wrapper>
            {dateKey === 'pending' ? (
                <ColPending data-test="@transaction-group/pending/count">
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
                    <ColAmount isVisible={isHovered}>
                        {totalAmount.gte(0) && <span>+</span>}
                        <FormattedCryptoAmount value={totalAmount.toFixed()} symbol={symbol} />
                    </ColAmount>
                    {showFiatValue && !isMissingFiatRates && (
                        <ColFiat>
                            <HiddenPlaceholder>
                                {totalFiatAmountPerDay.gte(0) && <span>+</span>}
                                <FiatAmountFormatter
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
