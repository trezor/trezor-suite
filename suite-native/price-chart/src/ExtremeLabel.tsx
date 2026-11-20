import { ChartAxisLabel } from './ChartAxisLabel';
import { type GraphExtremes } from './getGraphExtremes';
import { useGraphExtremes } from './useGraphExtremes';

type ExtremeLabelProps = {
    extremeName: keyof GraphExtremes;
};

export const ExtremeLabel = ({ extremeName }: ExtremeLabelProps) => {
    const extreme = useGraphExtremes()?.[extremeName];

    if (extreme === undefined) {
        return null;
    }

    // A new key replays the fade-in whenever the extreme moves.
    return <ChartAxisLabel key={`${extreme.value}-${extreme.relativeX}`} extreme={extreme} />;
};
