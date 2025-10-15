export const MARK_ELEMENT = 'mark' as const;
export const FIND_HIGHLIGHT_CLASSNAME = 'find-highlight' as const;
export const FIND_HIGHLIGHT_SELECTOR = `${MARK_ELEMENT}.${FIND_HIGHLIGHT_CLASSNAME}` as const;
export const MARK_HIGHLIGHT_PULSE_CLASSNAME = 'find-highlight-pulse' as const;
export const MARK_HIGHLIGHT_PULSE_SELECTOR = `.${MARK_HIGHLIGHT_PULSE_CLASSNAME}` as const;
export const NO_HIGHLIGHT_ATTRIBUTE = `data-no-highlight` as const;
