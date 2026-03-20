import { useMemo } from 'react';

import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { selectLanguage, suiteSettingsActions } from '@suite/settings';
import { LANGUAGES, type Locale, type LocaleInfo } from '@suite-common/suite-types';
import { getPlatformLanguages } from '@trezor/env-utils';
import { CROWDIN_URL } from '@trezor/urls';
import { typedObjectEntries } from '@trezor/utils';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, ActionSelect, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { getOsLocale } from 'src/utils/suite/l10n';

const onlyOfficial = (locale: [string, LocaleInfo]): locale is [Locale, LocaleInfo] =>
    locale[1].type === 'official';

const onlyCommunity = (locale: [string, LocaleInfo]): locale is [Locale, LocaleInfo] =>
    locale[1].type === 'community';

const getOptions = (filterPolicy: (locale: [string, LocaleInfo]) => boolean) =>
    typedObjectEntries(LANGUAGES)
        .filter(filterPolicy)
        .map(([value, { name }]) => ({ value, label: name }))
        .sort((a, b) => a.label.localeCompare(b.label));

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
                options: getOptions(onlyOfficial),
            },
            {
                label: translationString('TR_COMMUNITY_LANGUAGES'),
                options: getOptions(onlyCommunity),
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
    const analytics = useAnalytics();
    const language = useSelector(selectLanguage);
    const autodetectLanguage = useSelector(state => state.suiteSettings.autodetect.language);
    const dispatch = useDispatch();

    const { options, systemOption } = useLanguageOptions();

    const isCommunityLanguage = LANGUAGES[language].type === 'community';
    const selectedValue = autodetectLanguage
        ? systemOption
        : {
              value: language,
              label: LANGUAGES[language].name,
          };

    const onChange = ({ value }: { value: Locale | 'system' }) => {
        analytics.report({
            type: events.settingsGeneralChangeLanguageEvent.name,
            payload: {
                platformLanguages: getPlatformLanguages().join(','),
                previousLanguage: language,
                previousAutodetectLanguage: autodetectLanguage,
                language: value === 'system' ? getOsLocale() : value,
                autodetectLanguage: value === 'system',
            },
        });
        if ((value === 'system') !== autodetectLanguage) {
            dispatch(suiteSettingsActions.setAutodetect({ language: !autodetectLanguage }));
        }
        if (value !== 'system') {
            dispatch(suiteSettingsActions.setLanguage(value));
        }
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.Language}>
            <TextColumn
                title={<Translation id="TR_LANGUAGE" />}
                description={isCommunityLanguage && <Translation id="TR_LANGUAGE_DESCRIPTION" />}
                buttonTitle={<Translation id="TR_LANGUAGE_CREDITS" />}
                buttonLink={isCommunityLanguage ? CROWDIN_URL : undefined}
            />
            <ActionColumn>
                <ActionSelect
                    value={selectedValue}
                    options={options}
                    onChange={onChange}
                    data-testid="@settings/language-select"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
