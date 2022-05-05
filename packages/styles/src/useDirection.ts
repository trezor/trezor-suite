import { useContext, useMemo } from 'react';

import { DirectionContext } from './contexts';
import { DirectionUtils } from './types';

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
