import React, { useMemo } from 'react';
import { Translation } from '@suite-components';
import { isTranslationMode } from '@suite-utils/l10n';
import { useActions, useAnalytics, useSelector, useTranslation } from '@suite-hooks';
import LANGUAGES, { Locale, LocaleInfo } from '@suite-config/languages';
import { setAutodetect as setAutodetectAction } from '@suite-actions/suiteActions';
import { fetchLocale as fetchLocaleAction } from '@settings-actions/languageActions';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@suite-components/Settings';

const onlyComplete = (locale: [string, LocaleInfo]): locale is [Locale, LocaleInfo] =>
    !!locale[1].complete;

const useLanguageOptions = () => {
    const { translationString } = useTranslation();
    const systemOption = useMemo(
        () => ({
            value: 'auto',
            label: translationString('TR_SETTINGS_SAME_AS_SYSTEM'),
        }),
        [translationString],
    );
    const options = useMemo(
        () => [
            {
                options: [systemOption],
            },
            {
                options: Object.entries(LANGUAGES)
                    .filter(onlyComplete)
                    .map(([value, { name }]) => ({ value, label: name })),
            },
        ],
        [systemOption],
    );
    return {
        options,
        systemOption,
    };
};

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

    const { options, systemOption } = useLanguageOptions();

    const selectedValue =
        autodetectLanguage && !isTranslationMode()
            ? systemOption
            : {
                  value: language,
                  label: LANGUAGES[language].name,
              };

    const onChange = ({ value }: { value: Locale | 'auto' }) => {
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
                    options={options}
                    onChange={onChange}
                    isDisabled={isTranslationMode()}
                    data-test="@settings/language-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};

export default Language;
