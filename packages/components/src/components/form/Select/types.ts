export type Option = any;

export type SelectMenuAlign = 'start' | 'end';

/** Props threaded to the custom components through react-select's `selectProps`. */
export type CustomSelectProps = {
    /** Match the menu width to the control instead of sizing it to the longest option. */
    isMenuFullWidth?: boolean;
    /**
     * Horizontal alignment of the menu relative to the control. Use `end` when the
     * menu is wider than the control and should grow toward the start (left in LTR).
     */
    menuAlign?: SelectMenuAlign;
};
