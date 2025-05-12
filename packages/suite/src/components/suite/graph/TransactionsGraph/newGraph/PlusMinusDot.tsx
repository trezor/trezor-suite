import { useTheme } from 'styled-components';

export const PlusMinusDot = props => {
    const theme = useTheme();
    const { cx, cy, points, index } = props;
    const nextIndex = points.length >= index + 1 ? index + 1 : null;
    const currentPoint = points[index];
    const nextPoint = points[nextIndex];
    if (nextIndex == null || currentPoint?.x !== nextPoint?.x) return null;

    if (currentPoint?.y < nextPoint?.y) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 32 32"
                x={cx - 8}
                y={cy - 8}
                width={16}
                height={16}
            >
                <circle cx="16" cy="16" r="16" fill={theme.backgroundSurfaceElevation1} />

                <path
                    fill={theme.backgroundAlertRedBold}
                    d="M22 16a1 1 0 0 1-1 1H11a1 1 0 0 1 0-2h10a1 1 0 0 1 1 1m7 0A13 13 0 1 1 16 3a13.014 13.014 0 0 1 13 13m-2 0a11 11 0 1 0-11 11 11.01 11.01 0 0 0 11-11"
                />
            </svg>
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 32 32"
            x={cx - 8}
            y={cy - 8}
            width={16}
            height={16}
        >
            <circle cx="16" cy="16" r="16" fill={theme.backgroundSurfaceElevation1} />
            <path
                fill={theme.backgroundSecondaryDefault}
                d="M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m0 24a11 11 0 1 1 11-11 11.01 11.01 0 0 1-11 11m6-11a1 1 0 0 1-1 1h-4v4a1 1 0 0 1-2 0v-4h-4a1 1 0 0 1 0-2h4v-4a1 1 0 0 1 2 0v4h4a1 1 0 0 1 1 1"
            />
        </svg>
    );
};
