import React, { useMemo } from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite';
import { isTranslationMode, getOsLocale } from 'src/utils/suite/l10n';
import { useActions, useSelector, useTranslation } from 'src/hooks/suite';
import LANGUAGES, { Locale, LocaleInfo } from 'src/config/suite/languages';
import * as suiteActions from 'src/actions/suite/suiteActions';
import * as languageActions from 'src/actions/settings/languageActions';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { getPlatformLanguages } from '@trezor/env-utils';

const official = (locale: [string, LocaleInfo]): locale is [Locale, LocaleInfo] =>
    !!locale[1].complete && !!locale[1].official;

const community = (locale: [string, LocaleInfo]): locale is [Locale, LocaleInfo] =>
    locale[1].complete === true && locale[1].official === false;

const useLanguageOptions = () => {
    const { translationString } = useTranslation();
    const systemOption = useMemo(
        () => ({
            value: 'system',
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
                    .filter(official)
                    .map(([value, { name }]) => ({ value, label: `${name} (${translationString("TR_LOCALIZATION_OFFICIAL")})` }))
            },
            {
                options: Object.entries(LANGUAGES)
                .filter(community)
                .map(([value, { name }]) => ({ value, label: `${name} (${translationString("TR_LOCALIZATION_COMMUNITY")})` })),
            }
        ],
        [systemOption],
    );
    return {
        options,
        systemOption,
    };
};

export const Language = () => {
    const { language, autodetectLanguage } = useSelector(state => ({
        language: state.suite.settings.language,
        autodetectLanguage: state.suite.settings.autodetect.language,
    }));
    const { setLanguage, setAutodetect } = useActions({
        setLanguage: languageActions.setLanguage,
        setAutodetect: suiteActions.setAutodetect,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Language);

    const { options, systemOption } = useLanguageOptions();

    const selectedValue =
        autodetectLanguage && !isTranslationMode()
            ? systemOption
            : {
                  value: language,
                  label: LANGUAGES[language].name,
              };

    const onChange = ({ value }: { value: Locale | 'system' }) => {
        analytics.report({
            type: EventType.SettingsGeneralChangeLanguage,
            payload: {
                platformLanguages: getPlatformLanguages().join(','),
                previousLanguage: language,
                previousAutodetectLanguage: autodetectLanguage,
                language: value === 'system' ? getOsLocale() : value,
                autodetectLanguage: value === 'system',
            },
        });
        if ((value === 'system') !== autodetectLanguage) {
            setAutodetect({ language: !autodetectLanguage });
        }
        if (value !== 'system') {
            setLanguage(value);
        }
    };

    return (
        <SectionItem
            data-test="@settings/language"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn title={<Translation id="TR_LANGUAGE" />} />
            <ActionColumn>
                <ActionSelect
                    hideTextCursor
                    useKeyPressScroll
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
