import { useEffect } from 'react';

import { BreakpointFlags, above, below, breakpoints } from '@trezor/theme';

import { updateBreakpoints } from 'src/actions/suite/windowActions';
import { useDispatch } from 'src/hooks/suite';

type FlagName = keyof BreakpointFlags;

const Resize = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const queryList: Array<{ mq: MediaQueryList; flag: FlagName }> = Object.entries(breakpoints)
            .filter(([key]) => key !== 'unavailable')
            .flatMap(([key, value]) => {
                // Capitalize first letter for flag names
                const breakpointName = key.charAt(0).toUpperCase() + key.slice(1);

                const belowFlag = `isBelow${breakpointName}` as FlagName;
                const aboveFlag = `isAbove${breakpointName}` as FlagName;

                return [
                    {
                        mq: window.matchMedia(below(value)),
                        flag: belowFlag,
                    },
                    {
                        mq: window.matchMedia(above(value)),
                        flag: aboveFlag,
                    },
                ];
            });

        const initialFlags = queryList.reduce<Partial<BreakpointFlags>>((acc, { mq, flag }) => {
            acc[flag] = mq.matches;

            return acc;
        }, {});
        dispatch(updateBreakpoints(initialFlags));

        const handlers = queryList.map(({ mq, flag }) => {
            const handler = (e: MediaQueryListEvent) => {
                dispatch(updateBreakpoints({ [flag]: e.matches }));
            };

            mq.addEventListener('change', handler);

            return { mq, handler };
        });

        return () => {
            handlers.forEach(({ mq, handler }) => {
                mq.removeEventListener('change', handler);
            });
        };
    }, [dispatch]);

    return null;
};

export default Resize;
