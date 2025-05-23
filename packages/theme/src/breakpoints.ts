export const breakpoints = {
    mobile: 576, // Previously SM
    tablet: 768, // Previously MD
    laptop: 992, // Previously LG
    desktop: 1200, // Previously XL
} as const;

export type Breakpoint = keyof typeof breakpoints;
export type BreakpointValue = (typeof breakpoints)[Breakpoint];
export type BreakpointFlagName =
    | `isBelow${Capitalize<Breakpoint>}`
    | `isAbove${Capitalize<Breakpoint>}`;

export type BreakpointFlags = {
    [K in BreakpointFlagName]: boolean;
};

export const belowBreakpoint = (breakpoint: BreakpointValue) => `(max-width: ${breakpoint - 1}px)`;
export const aboveBreakpoint = (breakpoint: BreakpointValue) => `(min-width: ${breakpoint}px)`;

export const getBreakpointFlagNames = (
    breakpoint: Breakpoint,
): [BreakpointFlagName, BreakpointFlagName] => {
    const capitalizedBreakpoint = (breakpoint.charAt(0).toUpperCase() +
        breakpoint.slice(1)) as Capitalize<Breakpoint>;

    return [`isBelow${capitalizedBreakpoint}`, `isAbove${capitalizedBreakpoint}`];
};

export const initialBreakpointFlags: BreakpointFlags = Object.keys(breakpoints).reduce(
    (acc, breakpoint) => {
        const [belowFlag, aboveFlag] = getBreakpointFlagNames(breakpoint as Breakpoint);
        acc[belowFlag] = false;
        acc[aboveFlag] = false;

        return acc;
    },
    {} as BreakpointFlags,
);
