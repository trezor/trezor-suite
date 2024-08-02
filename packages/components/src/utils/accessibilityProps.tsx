export type AccessibilityProps = {
    tabIndex?: number;
};

export const withAccessibilityProps = ({ tabIndex }: AccessibilityProps) => {
    return { tabIndex };
};
