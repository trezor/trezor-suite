import { type EffectCallback, useEffect, useRef } from 'react';

export const useUpdateEffect = (effect: EffectCallback) => {
    const isFirstMount = useRef(true);

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;

            return undefined;
        }

        return effect();
    }, [effect]);
};
