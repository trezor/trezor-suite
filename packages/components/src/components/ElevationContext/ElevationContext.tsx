import { Elevation, nextElevation } from '@trezor/theme/src/elevation';
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

export const useElevation = () => {
    const elevation = useContext(ElevationReactContext);

    const innerElevation = useMemo(() => nextElevation[elevation], [elevation]);

    return { elevation: innerElevation };
};
