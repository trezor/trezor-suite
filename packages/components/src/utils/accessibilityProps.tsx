export type AccessibilityProps = {
    tabIndex?: number;
};

export const withAccessibilityProps = ({ tabIndex }: AccessibilityProps) => ({ tabIndex });
