import { type ReactNode, createContext } from 'react';

import { type GraphPoint } from '@suite-native/react-native-graph';

import { type GraphExtremes, getGraphExtremes } from './getGraphExtremes';

export const GraphExtremesContext = createContext<GraphExtremes | undefined>(undefined);

type GraphExtremesProviderProps = {
    points: GraphPoint[];
    isHidden?: boolean;
    children: ReactNode;
};

/**
 * Hands the high and the low of the points to `HighExtremeLabel` and `LowExtremeLabel`, which a
 * line graph inside renders as its `TopAxisLabel` and `BottomAxisLabel`.
 */
export const GraphExtremesProvider = ({
    points,
    isHidden = false,
    children,
}: GraphExtremesProviderProps) => (
    <GraphExtremesContext value={isHidden ? undefined : getGraphExtremes(points)}>
        {children}
    </GraphExtremesContext>
);
