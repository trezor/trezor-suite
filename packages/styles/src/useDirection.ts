import { useContext, useMemo } from 'react';
import { DirectionUtils } from './types';
import { DirectionContext } from './contexts';

export const useDirection = (): DirectionUtils => {
    const direction = useContext(DirectionContext);

    return useMemo(
        () => ({
            direction,
            isLtr: direction === 'ltr',
            isRtl: direction === 'rtl',
        }),
        [direction],
    );
};
