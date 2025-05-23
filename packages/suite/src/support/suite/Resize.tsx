import { useEffect } from 'react';

import {
    Breakpoint,
    BreakpointFlagName,
    BreakpointFlags,
    BreakpointValue,
    aboveBreakpoint,
    belowBreakpoint,
    breakpoints,
    getBreakpointFlagNames,
} from '@trezor/theme';

import { updateBreakpoints } from 'src/actions/suite/windowActions';
import { useDispatch } from 'src/hooks/suite';

const Resize = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const queryList: Array<{ mq: MediaQueryList; flag: BreakpointFlagName }> = (
            Object.entries(breakpoints) as [Breakpoint, BreakpointValue][]
        ).flatMap(([breakpoint, breakpointValue]) => {
            const [belowFlag, aboveFlag] = getBreakpointFlagNames(breakpoint);

            return [
                {
                    mq: window.matchMedia(belowBreakpoint(breakpointValue)),
                    flag: belowFlag,
                },
                {
                    mq: window.matchMedia(aboveBreakpoint(breakpointValue)),
                    flag: aboveFlag,
                },
            ];
        });

        const initialFlags = queryList.reduce<Partial<BreakpointFlags>>((acc, { mq, flag }) => {
            acc[flag] = mq.matches;

            return acc;
        }, {});

        const handlers = queryList.map(({ mq, flag }) => {
            const handler = (e: MediaQueryListEvent) => {
                dispatch(updateBreakpoints({ [flag]: e.matches }));
            };

            mq.addEventListener('change', handler);

            return { mq, handler };
        });

        dispatch(updateBreakpoints(initialFlags));

        return () => {
            handlers.forEach(({ mq, handler }) => {
                mq.removeEventListener('change', handler);
            });
        };
    }, [dispatch]);

    return null;
};

export default Resize;
