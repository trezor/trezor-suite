export const TOOLTIP_DELAY_NONE = 0;
export const TOOLTIP_DELAY_SHORT = 200;
export const TOOLTIP_DELAY_NORMAL = 500;
export const TOOLTIP_DELAY_LONG = 1000;

export type TooltipDelay =
    | typeof TOOLTIP_DELAY_NONE
    | typeof TOOLTIP_DELAY_SHORT
    | typeof TOOLTIP_DELAY_NORMAL
    | typeof TOOLTIP_DELAY_LONG;
