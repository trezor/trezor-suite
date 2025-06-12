import { useEffect, useState } from 'react';

import { isSameYear } from 'date-fns';
import { ComposedChart, ResponsiveContainer } from 'recharts';
import { useTheme } from 'styled-components';

import { renderAxes } from './renderAxes';
import { renderCryptoBalanceLine } from './renderCryptoBalanceLine';
import { renderFiatBalanceJumps } from './renderFiatBalanceJumps';
import { renderFiatBalanceLine } from './renderFiatBalanceLine';
import { renderLinearGradient } from './renderLinearGradient';
import { renderReferenceLines } from './renderReferenceLines';
import { renderTooltip } from './renderTooltip';
import { MetaData, RawDataItem } from './types';
import { calculateMetaData, calculateSegments } from './utils';
import { GraphSkeleton } from '../../GraphSkeleton';

type TransactionsGraphProps = {
    data: RawDataItem[];
    localCurrency: string;
    segments: RawDataItem[][];
    setSegments: (verticalSegments: RawDataItem[][]) => void;
    verticalSegments: RawDataItem[][];
    setVerticalSegments: (verticalSegments: RawDataItem[][]) => void;
    ticks: string[];
    setTicks: (verticalSegments: string[]) => void;
    metaData: MetaData;
};

export const TransactionsGraph = ({
    data,
    localCurrency,
    segments,

    verticalSegments,

    ticks,
    metaData,
}: TransactionsGraphProps) => {
    const theme = useTheme();

    // const [isLoading, setIsLoading] = useState<boolean>(true);
    //
    //
    //
    //
    // if (isLoading) {
    //     return <GraphSkeleton animate />;
    // }

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
                    {renderReferenceLines({ metaData, theme, localCurrency })}
                </ComposedChart>
            </ResponsiveContainer>
        </>
    );
};
