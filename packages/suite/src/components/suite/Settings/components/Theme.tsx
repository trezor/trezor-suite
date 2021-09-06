import React from 'react';
import * as suiteActions from '@suite-actions/suiteActions';
import { Translation } from '@suite-components/Translation';
import { SectionItem, ActionColumn, ActionSelect, TextColumn } from '@suite-components/Settings';
import { useActions, useSelector } from '@suite-hooks';
import type { SuiteThemeVariant } from '@suite-types';

const THEME_OPTIONS = [
    {
        options: [{ value: 'auto', label: <Translation id="TR_SETTINGS_SAME_AS_SYSTEM" /> }],
    },
    {
        options: [
            { value: 'light', label: <Translation id="TR_COLOR_SCHEME_LIGHT" /> },
            { value: 'dark', label: <Translation id="TR_COLOR_SCHEME_DARK" /> },
        ],
    },
] as const;

const getThemeOption = (theme: 'auto' | 'light' | 'dark') => {
    switch (theme) {
        case 'auto':
            return THEME_OPTIONS[0].options[0];
        case 'dark':
            return THEME_OPTIONS[1].options[1];
        case 'light':
        default:
            return THEME_OPTIONS[1].options[0];
    }
};

const Theme = () => {
    const { theme, autodetectTheme } = useSelector(state => ({
        theme: state.suite.settings.theme,
        autodetectTheme: state.suite.settings.autodetect.theme,
    }));
    const { setTheme, setAutodetect } = useActions({
        setTheme: suiteActions.setTheme,
        setAutodetect: suiteActions.setAutodetect,
    });

    const getVariant = (variant: SuiteThemeVariant) => (variant !== 'light' ? 'dark' : 'light');

    const selectedValue = getThemeOption(autodetectTheme ? 'auto' : getVariant(theme.variant));

    const onChange = ({ value }: typeof THEME_OPTIONS[number]['options'][number]) => {
        if ((value === 'auto') !== autodetectTheme) {
            setAutodetect({ theme: !autodetectTheme });
        }
        if (value !== 'auto') {
            setTheme(getVariant(value));
        }
    };

    return (
        <SectionItem>
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
                    options={THEME_OPTIONS}
                    onChange={onChange}
                    data-test="@theme/color-scheme-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};

export default Theme;
