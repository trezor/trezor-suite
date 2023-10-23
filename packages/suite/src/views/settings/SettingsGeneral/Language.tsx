import { useMemo } from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';

import {
    ActionColumn,
    ActionSelect,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { isTranslationMode, getOsLocale } from 'src/utils/suite/l10n';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import LANGUAGES, { Locale, LocaleInfo } from 'src/config/suite/languages';
import { setAutodetect } from 'src/actions/suite/suiteActions';
import { setLanguage } from 'src/actions/settings/languageActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { getPlatformLanguages } from '@trezor/env-utils';
import { CROWDIN_URL } from '@trezor/urls';

const onlyOfficial = (locale: [string, LocaleInfo]): locale is [Locale, LocaleInfo] =>
    locale[1].type === 'official';

const onlyCommunity = (locale: [string, LocaleInfo]): locale is [Locale, LocaleInfo] =>
    locale[1].type === 'community';

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
                label: translationString('TR_OFFICIAL_LANGUAGES'),
                options: Object.entries(LANGUAGES)
                    .filter(onlyOfficial)
                    .map(([value, { name }]) => ({ value, label: name })),
            },
            {
                label: translationString('TR_COMMUNITY_LANGUAGES'),
                options: Object.entries(LANGUAGES)
                    .filter(onlyCommunity)
                    .map(([value, { name }]) => ({ value, label: name })),
            },
        ],
        [systemOption, translationString],
    );
    return {
        options,
        systemOption,
    };
};

export const Language = () => {
    const language = useSelector(state => state.suite.settings.language);
    const autodetectLanguage = useSelector(state => state.suite.settings.autodetect.language);
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Language);

    const { options, systemOption } = useLanguageOptions();

    const isCommunityLanguage = LANGUAGES[language].type === 'community';
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
            dispatch(setAutodetect({ language: !autodetectLanguage }));
        }
        if (value !== 'system') {
            dispatch(setLanguage(value));
        }
    };

    return (
        <SectionItem
            data-test="@settings/language"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_LANGUAGE" />}
                description={isCommunityLanguage && <Translation id="TR_LANGUAGE_DESCRIPTION" />}
                buttonTitle={<Translation id="TR_LANGUAGE_CREDITS" />}
                buttonLink={isCommunityLanguage ? CROWDIN_URL : undefined}
            />
            <ActionColumn>
                <ActionSelect
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
