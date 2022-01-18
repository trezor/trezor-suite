import React, { useMemo } from 'react';

import * as suiteActions from '@suite-actions/suiteActions';
import { Translation } from '@suite-components/Translation';
import { SectionItem, ActionColumn, ActionSelect, TextColumn } from '@suite-components/Settings';
import { useActions, useSelector, useTranslation } from '@suite-hooks';
import type { SuiteThemeVariantOptions } from '@suite-types';

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
    const getOption = (theme: SuiteThemeVariantOptions) => {
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

    const { options, getOption } = useThemeOptions();

    const getVariant = (variant: SuiteThemeVariant) => (variant !== 'light' ? 'dark' : 'light');

    const selectedValue = getOption(autodetectTheme ? 'system' : getVariant(theme.variant));

    const onChange = ({ value }: { value: SuiteThemeVariantOptions }) => {
        if ((value === 'system') !== autodetectTheme) {
            setAutodetect({ theme: !autodetectTheme });
        }
        if (value === 'system') {
            window.desktopApi?.themeSystem();
        } else {
            setTheme(getVariant(value));
            window.desktopApi?.themeChange(value);
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
                    options={options}
                    onChange={onChange}
                    data-test="@theme/color-scheme-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};
