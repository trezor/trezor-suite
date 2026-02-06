const ORIGIN_COLORS_IN_ANIMATION = {
    BODY: '#00854DFF',
    WARNING_BACKGROUND: '#f7bf2f',
    WARNING_FOREGROUND: '#ffffff',
};

type SpinnerColorsReplaceArgs = {
    bodyColor: string;
    warningBackgroundColor: string;
    warningForegroundColor: string;
};

export const getSpinnerColorsReplace = ({
    bodyColor,
    warningBackgroundColor,
    warningForegroundColor,
}: SpinnerColorsReplaceArgs) => [
    { from: ORIGIN_COLORS_IN_ANIMATION.BODY, to: bodyColor },
    {
        from: ORIGIN_COLORS_IN_ANIMATION.WARNING_BACKGROUND,
        to: warningBackgroundColor,
    },
    {
        from: ORIGIN_COLORS_IN_ANIMATION.WARNING_FOREGROUND,
        to: warningForegroundColor,
    },
];
