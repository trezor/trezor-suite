import { Elevation, nextElevation } from '@trezor/theme';
import { ReactNode, createContext, useContext, useMemo } from 'react';

const ElevationReactContext = createContext<Elevation>(0);

export const ElevationContext = ({
    children,
    baseElevation,
}: {
    children: ReactNode;
    baseElevation: Elevation;
}) => (
    <ElevationReactContext.Provider value={baseElevation}>
        {children}
    </ElevationReactContext.Provider>
);

export const useElevation = (forceElevation?: Elevation) => {
    const elevation = useContext(ElevationReactContext);

    const innerElevation = useMemo(
        () =>
            // eslint-disable-next-line no-nested-ternary
            forceElevation !== undefined
                ? forceElevation
                : elevation !== null
                ? nextElevation[elevation]
                : 0,
        [elevation, forceElevation],
    );

    return { elevation: innerElevation };
};
