import { ChartAxisLabel } from './ChartAxisLabel';
import { useGraphExtremes } from './useGraphExtremes';

/** A line graph's `TopAxisLabel`: the high of the points given to `GraphExtremesProvider`. */
export const HighExtremeLabel = () => {
    const high = useGraphExtremes()?.high;

    if (high === undefined) {
        return null;
    }

    // A new key replays the fade-in whenever the high moves.
    return <ChartAxisLabel key={`${high.value}-${high.relativeX}`} extreme={high} />;
};
