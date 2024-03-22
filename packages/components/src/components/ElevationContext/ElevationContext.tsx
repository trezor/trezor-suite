import { Elevation, nextElevation, prevElevation } from '@trezor/theme';
import { ReactNode, createContext, useContext, useMemo } from 'react';

const ElevationReactContext = createContext<{
    elevation: Elevation;
    direction: ElevationDirection;
}>({ elevation: 0, direction: 'up' });

type ElevationDirection = 'down' | 'up';

type ElevationContextProps = {
    children: ReactNode;
    baseElevation: Elevation;
    direction?: ElevationDirection;
};

/**
 * @deprecated Always prefer ElevationDown/ElevationUp if possible.
 */
export const ElevationContext = ({
    children,
    baseElevation,
    direction = 'up',
}: ElevationContextProps) => (
    <ElevationReactContext.Provider value={{ elevation: baseElevation, direction }}>
        {children}
    </ElevationReactContext.Provider>
);

export const useElevation = (forceElevation?: Elevation) => {
    const { elevation, direction } = useContext(ElevationReactContext);

    const innerElevation = useMemo(() => {
        const directionMap = direction === 'up' ? nextElevation : prevElevation;

        // eslint-disable-next-line no-nested-ternary
        return forceElevation !== undefined
            ? forceElevation
            : elevation !== null
              ? directionMap[elevation]
              : 0;
    }, [elevation, forceElevation, direction]);

    return { elevation: innerElevation, parentElevation: elevation ?? -1 };
};

export const ElevationDown = ({ children }: { children: ReactNode }) => {
    const { elevation } = useElevation();

    return (
        <ElevationContext baseElevation={elevation} direction="down">
            {children}
        </ElevationContext>
    );
};

export const ElevationUp = ({ children }: { children: ReactNode }) => {
    const { elevation } = useElevation();

    return (
        <ElevationContext baseElevation={elevation} direction="up">
            {children}
        </ElevationContext>
    );
};
