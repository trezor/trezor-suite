import { XAxis, YAxis } from 'recharts';
import { dateFormatter } from './utils';

export type RenderAxesProps = {
    ticks: string[];
    shouldShowYearInXAxis: boolean;
};

export const renderAxes = ({ ticks, shouldShowYearInXAxis }: RenderAxesProps) => {
    return (
        <>
            <XAxis
                tick={{ fontSize: 12 }}
                dataKey="date"
                allowDuplicatedCategory={false}
                tickFormatter={date => dateFormatter(date, shouldShowYearInXAxis)}
                minTickGap={100}
                tickLine={false}
                axisLine={false}
                padding={{ left: 0, right: 0 }}
                interval="preserveStartEnd"
                ticks={[...new Set(ticks)]}
            />
            <YAxis type="number" domain={[0, 'auto']} ticks={[]} hide={true} allowDataOverflow />
        </>
    );
};
