import React, { useMemo } from 'react';
import { desktopApi, SuiteThemeVariant } from '@trezor/suite-desktop-api';
import * as suiteActions from '@suite-actions/suiteActions';
import { Translation } from '@suite-components/Translation';
import { SectionItem, ActionColumn, ActionSelect, TextColumn } from '@suite-components/Settings';
import { useActions, useSelector, useTranslation } from '@suite-hooks';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

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
    const { theme, autodetectTheme } = useSelector(state => ({
        theme: state.suite.settings.theme,
        autodetectTheme: state.suite.settings.autodetect.theme,
    }));
    const { setTheme, setAutodetect } = useActions({
        setTheme: suiteActions.setTheme,
        setAutodetect: suiteActions.setAutodetect,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Theme);

    const { options, getOption } = useThemeOptions();

    const selectedValue = getOption(autodetectTheme ? 'system' : theme.variant);

    const onChange = ({ value }: { value: SuiteThemeVariant }) => {
        if ((value === 'system') !== autodetectTheme) {
            setAutodetect({ theme: !autodetectTheme });
        }
        if (value !== 'system') {
            setTheme(value);
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
                    noTopLabel
                    value={selectedValue}
                    options={options}
                    onChange={onChange}
                    data-test="@theme/color-scheme-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};
