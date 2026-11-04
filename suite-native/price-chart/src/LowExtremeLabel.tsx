import { ChartAxisLabel } from './ChartAxisLabel';
import { useGraphExtremes } from './useGraphExtremes';

/** A line graph's `BottomAxisLabel`: the low of the points given to `GraphExtremesProvider`. */
export const LowExtremeLabel = () => {
    const low = useGraphExtremes()?.low;

    if (low === undefined) {
        return null;
    }

    // A new key replays the fade-in whenever the low moves.
    return <ChartAxisLabel key={`${low.value}-${low.relativeX}`} extreme={low} />;
};
