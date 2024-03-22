import { analytics, EventType } from '@trezor/suite-analytics';

import { desktopApi, SuiteThemeVariant } from '@trezor/suite-desktop-api';
import { setAutodetect, setTheme } from 'src/actions/suite/suiteActions';
import {
    ActionColumn,
    ActionSelect,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { getOsTheme } from 'src/utils/suite/env';
import { ThemeColorVariant } from '@trezor/theme';

type ThemeColorVariantWithSystem = ThemeColorVariant | 'system';
type Option = { value: ThemeColorVariantWithSystem; label: string };

const useThemeOptions = () => {
    const { translationString } = useTranslation();
    const showDebugMenu = useSelector(state => state.suite.settings.debug.showDebugMenu);

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
        { options: [lightOption, darkOption, ...(showDebugMenu ? [debugOption] : [])] },
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
    const theme = useSelector(state => state.suite.settings.theme);
    const autodetectTheme = useSelector(state => state.suite.settings.autodetect.theme);
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Theme);
    const { optionGroups, getOption } = useThemeOptions();

    const themeVariant = autodetectTheme ? 'system' : theme.variant;
    const selectedValue = getOption(themeVariant === 'light' ? 'standard' : themeVariant);

    const onChange = ({ value }: { value: SuiteThemeVariant }) => {
        const platformTheme = getOsTheme();
        analytics.report({
            type: EventType.SettingsGeneralChangeTheme,
            payload: {
                platformTheme,
                previousTheme: theme.variant,
                previousAutodetectTheme: autodetectTheme,
                theme: value === 'system' ? platformTheme : value,
                autodetectTheme: value === 'system',
            },
        });

        if ((value === 'system') !== autodetectTheme) {
            dispatch(setAutodetect({ theme: !autodetectTheme }));
        }

        if (value !== 'system') {
            dispatch(setTheme(value));
        }

        if (desktopApi.available) {
            desktopApi.themeChange(value);
        }
    };

    return (
        <SectionItem data-test="@settings/theme" ref={anchorRef} shouldHighlight={shouldHighlight}>
            <TextColumn
                title={<Translation id="TR_COLOR_SCHEME" />}
                description={<Translation id="TR_COLOR_SCHEME_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionSelect
                    useKeyPressScroll
                    value={selectedValue}
                    options={optionGroups}
                    onChange={onChange}
                    data-test="@theme/color-scheme-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};
