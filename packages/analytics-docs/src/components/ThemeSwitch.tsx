import { IconButton, Tooltip } from '@trezor/components';

import { type ThemePreference, useTheme } from '../contexts/ThemeContext';

const CYCLE: ThemePreference[] = ['system', 'light', 'dark'];

const PREFERENCE_ICON: Record<ThemePreference, 'circleHalf' | 'sun' | 'moon'> = {
    system: 'circleHalf',
    light: 'sun',
    dark: 'moon',
};

const PREFERENCE_TOOLTIP: Record<ThemePreference, string> = {
    system: 'Same as system',
    light: 'Light theme',
    dark: 'Dark theme',
};

export const ThemeSwitch = () => {
    const { preference, setPreference } = useTheme();

    const currentIndex = CYCLE.indexOf(preference);
    const nextPreference = CYCLE[(currentIndex + 1) % CYCLE.length] ?? 'system';
    const tooltipContent = `Switch to ${PREFERENCE_TOOLTIP[nextPreference]}`;

    return (
        <Tooltip content={tooltipContent}>
            <IconButton
                icon={PREFERENCE_ICON[preference]}
                size="small"
                intent="neutral"
                priority="secondary"
                onClick={() => setPreference(nextPreference)}
                aria-label={tooltipContent}
            />
        </Tooltip>
    );
};
