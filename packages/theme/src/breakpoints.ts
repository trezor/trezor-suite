export const breakpoints = {
    unavailable: 260,
    mobile: 576, // Previously SM
    tablet: 768, // Previously MD
    laptop: 992, // Previously LG
    desktop: 1200, // Previously XL
} as const;

export type Breakpoint = keyof typeof breakpoints;
export type BreakpointValue = (typeof breakpoints)[Breakpoint];

export const below = (breakpoint: BreakpointValue) => `(max-width: ${breakpoint - 1}px)`;
export const above = (breakpoint: BreakpointValue) => `(min-width: ${breakpoint}px)`;

export type BreakpointFlags = {
    isBelowMobile: boolean;
    isBelowTablet: boolean;
    isBelowLaptop: boolean;
    isBelowDesktop: boolean;
    isAboveMobile: boolean;
    isAboveTablet: boolean;
    isAboveLaptop: boolean;
    isAboveDesktop: boolean;
};

export const initialBreakpointFlags: BreakpointFlags = {
    isBelowMobile: false,
    isBelowTablet: false,
    isBelowLaptop: false,
    isBelowDesktop: false,
    isAboveMobile: false,
    isAboveTablet: false,
    isAboveLaptop: false,
    isAboveDesktop: false,
};
