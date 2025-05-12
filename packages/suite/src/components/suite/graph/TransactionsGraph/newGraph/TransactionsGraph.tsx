import { isSameYear } from 'date-fns';
import { ComposedChart, ResponsiveContainer } from 'recharts';
import { useTheme } from 'styled-components';

import { FiatCurrencyCode } from '@suite-common/suite-config';

import { renderAxes } from './renderAxes';
import { renderCryptoBalanceLine } from './renderCryptoBalanceLine';
import { renderFiatBalanceJumps } from './renderFiatBalanceJumps';
import { renderFiatBalanceLine } from './renderFiatBalanceLine';
import { renderLinearGradient } from './renderLinearGradient';
import { renderReferenceLines } from './renderReferenceLines';
import { renderTooltip } from './renderTooltip';
import { RawDataItem } from './types';
import { GraphRange } from '../../../../../types/wallet/graph';
import { useGraphData } from '../../../../../views/wallet/transactions/components/useGraphData';
import { GraphSkeleton } from '../../GraphSkeleton';

type TransactionsGraphProps = {
    localCurrency: FiatCurrencyCode;
    selectedRange: GraphRange;
    balanceGraphData: RawDataItem[];
    startBalance: number | null;
    fiatRates: RawDataItem[];
    isLoading?: boolean;
};

export const TransactionsGraph = ({
    localCurrency,
    selectedRange,
    balanceGraphData,
    startBalance,
    fiatRates,
    isLoading,
}: TransactionsGraphProps) => {
    const graphData = useGraphData({
        selectedRange,
        balanceGraphData,
        startBalance,
        fiatRates,
    });
    const { data, metaData, segments, verticalSegments, ticks } = graphData;

    const theme = useTheme();

    if (isLoading || startBalance === null) {
        return <GraphSkeleton animate />;
    }

    const shouldShowYearInXAxis =
        data.length > 1
            ? isSameYear(new Date(data[0].date), new Date(data[data.length - 1].date))
            : true;

    return (
        <>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data} margin={{ top: 20, right: 0, left: 70, bottom: 0 }}>
                    {renderAxes({ ticks, shouldShowYearInXAxis })}
                    {renderTooltip({ theme, localCurrency })}
                    {renderLinearGradient({ theme })}
                    {renderFiatBalanceLine({ segments, theme })}
                    {renderFiatBalanceJumps({ verticalSegments, theme })}
                    {renderCryptoBalanceLine({ theme })}
                    {/*{renderCryptoInvestmentBalanceLine({ theme })}*/}
                    {renderReferenceLines({ metaData, theme, localCurrency })}
                </ComposedChart>
            </ResponsiveContainer>
        </>
    );
};
