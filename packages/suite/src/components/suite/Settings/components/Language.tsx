import React from 'react';
import { Translation } from '@suite-components';
import { isTranslationMode } from '@suite-utils/l10n';
import { useActions, useAnalytics, useSelector } from '@suite-hooks';
import LANGUAGES, { Locale, LocaleInfo } from '@suite-config/languages';
import { setAutodetect as setAutodetectAction } from '@suite-actions/suiteActions';
import { fetchLocale as fetchLocaleAction } from '@settings-actions/languageActions';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@suite-components/Settings';

const SYSTEM_OPTION = {
    value: 'auto',
    label: <Translation id="TR_SETTINGS_SAME_AS_SYSTEM" />,
} as const;

const onlyComplete = (locale: [string, LocaleInfo]): locale is [Locale, LocaleInfo] =>
    !!locale[1].complete;

const LANGUAGE_OPTIONS = [
    {
        options: [SYSTEM_OPTION],
    },
    {
        options: Object.entries(LANGUAGES)
            .filter(onlyComplete)
            .map(([value, { name }]) => ({ value, label: name })),
    },
];

const Language = () => {
    const analytics = useAnalytics();
    const { language, autodetectLanguage } = useSelector(state => ({
        language: state.suite.settings.language,
        autodetectLanguage: state.suite.settings.autodetect.language,
    }));
    const { fetchLocale, setAutodetect } = useActions({
        fetchLocale: fetchLocaleAction,
        setAutodetect: setAutodetectAction,
    });

    const selectedValue =
        autodetectLanguage && !isTranslationMode()
            ? SYSTEM_OPTION
            : {
                  value: language,
                  label: LANGUAGES[language].name,
              };

    const onChange = ({ value }: typeof LANGUAGE_OPTIONS[number]['options'][number]) => {
        if ((value === 'auto') !== autodetectLanguage) {
            setAutodetect({ language: !autodetectLanguage });
        }
        if (value !== 'auto') {
            fetchLocale(value);
            analytics.report({
                type: 'settings/general/change-language',
                payload: {
                    language: value,
                },
            });
        }
    };

    return (
        <SectionItem data-test="@settings/language">
            <TextColumn title={<Translation id="TR_LANGUAGE" />} />
            <ActionColumn>
                <ActionSelect
                    hideTextCursor
                    useKeyPressScroll
                    noTopLabel
                    value={selectedValue}
                    options={LANGUAGE_OPTIONS}
                    onChange={onChange}
                    isDisabled={isTranslationMode()}
                    data-test="@settings/language-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};

export default Language;
