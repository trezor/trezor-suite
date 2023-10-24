import { useMemo } from 'react';
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

const useThemeOptions = () => {
    const { translationString } = useTranslation();
    const options = useMemo(
        () => [
            {
                options: [
                    { value: 'system', label: translationString('TR_SETTINGS_SAME_AS_SYSTEM') },
                ],
            },
            {
                options: [
                    { value: 'light', label: translationString('TR_COLOR_SCHEME_LIGHT') },
                    { value: 'dark', label: translationString('TR_COLOR_SCHEME_DARK') },
                ],
            },
        ],
        [translationString],
    );
    const getOption = (theme: SuiteThemeVariant) => {
        switch (theme) {
            case 'system':
                return options[0].options[0];
            case 'dark':
                return options[1].options[1];
            case 'light':
            default:
                return options[1].options[0];
        }
    };
    return {
        options,
        getOption,
    };
};

export const Theme = () => {
    const theme = useSelector(state => state.suite.settings.theme);
    const autodetectTheme = useSelector(state => state.suite.settings.autodetect.theme);
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Theme);
    const { options, getOption } = useThemeOptions();

    const selectedValue = getOption(autodetectTheme ? 'system' : theme.variant);

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
                    hideTextCursor
                    useKeyPressScroll
                    value={selectedValue}
                    options={options}
                    onChange={onChange}
                    data-test="@theme/color-scheme-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};
