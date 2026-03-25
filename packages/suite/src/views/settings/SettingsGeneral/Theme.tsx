import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import {
    selectAutodetectTheme,
    selectIsDebugModeActive,
    selectThemeSettings,
    suiteSettingsActions,
} from '@suite/settings';
import { ActionColumn, ActionSelect, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { type ThemeColorVariant } from '@trezor/theme';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { getOsTheme } from 'src/utils/suite/env';

type ThemeColorVariantWithSystem = ThemeColorVariant | 'system';
type Option = { value: ThemeColorVariantWithSystem; label: string };

const useThemeOptions = () => {
    const { translationString } = useTranslation();
    const isDebug = useSelector(selectIsDebugModeActive);

    const systemOption: Option = {
        value: 'system',
        label: translationString('TR_SETTINGS_SAME_AS_SYSTEM'),
    };
    const darkOption: Option = { value: 'dark', label: translationString('TR_COLOR_SCHEME_DARK') };
    const lightOption: Option = {
        value: 'standard',
        label: translationString('TR_COLOR_SCHEME_LIGHT'),
    };
    const debugOption: Option = { value: 'debug', label: 'Debug' };

    const optionGroups = [
        { options: [systemOption] },
        { options: [lightOption, darkOption, ...(isDebug ? [debugOption] : [])] },
    ];

    const getOption = (theme: ThemeColorVariantWithSystem) => {
        const map: Record<ThemeColorVariantWithSystem, Option> = {
            debug: debugOption,
            standard: lightOption,
            dark: darkOption,
            system: systemOption,
        };

        return map[theme];
    };

    return {
        optionGroups,
        getOption,
    };
};

export const Theme = () => {
    const analytics = useAnalytics();
    const theme = useSelector(selectThemeSettings);
    const autodetectTheme = useSelector(selectAutodetectTheme);
    const dispatch = useDispatch();
    const { optionGroups, getOption } = useThemeOptions();

    const themeVariant = autodetectTheme ? 'system' : theme.variant;
    const selectedValue = getOption(themeVariant === 'light' ? 'standard' : themeVariant);

    const onChange = ({ value }: { value: ThemeColorVariantWithSystem }) => {
        // Inconsistency between types (standard = light)
        const themeValue = value === 'standard' ? 'light' : value;

        const platformTheme = getOsTheme();
        analytics.report({
            type: events.settingsGeneralChangeThemeEvent.name,
            payload: {
                platformTheme,
                previousTheme: theme.variant,
                previousAutodetectTheme: autodetectTheme,
                theme: themeValue === 'system' ? platformTheme : themeValue,
                autodetectTheme: themeValue === 'system',
            },
        });

        if ((themeValue === 'system') !== autodetectTheme) {
            dispatch(suiteSettingsActions.setAutodetect({ theme: !autodetectTheme }));
        }

        if (themeValue !== 'system') {
            dispatch(suiteSettingsActions.setTheme(themeValue));
        }

        if (desktopApi.available) {
            // Remove `debug` option
            const nativeThemeValue = themeValue === 'debug' ? 'light' : themeValue;
            desktopApi.themeChange(nativeThemeValue);
        }
    };

    return (
        <>
            <SettingsSectionItem anchorId={SettingsAnchor.Theme}>
                <TextColumn
                    title={<Translation id="TR_COLOR_SCHEME" />}
                    description={<Translation id="TR_COLOR_SCHEME_DESCRIPTION" />}
                />

                <ActionColumn>
                    <ActionSelect
                        value={selectedValue}
                        options={optionGroups}
                        onChange={onChange}
                        data-testid="@theme/color-scheme-select"
                    />
                </ActionColumn>
            </SettingsSectionItem>
        </>
    );
};
