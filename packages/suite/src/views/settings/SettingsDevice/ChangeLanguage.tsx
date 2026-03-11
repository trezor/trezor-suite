import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { LANGUAGES, Locale } from '@suite-common/suite-types';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, ActionSelect, TextColumn } from 'src/components/suite';

import { changeLanguage } from '../../../actions/settings/deviceSettingsActions';
import { useDevice, useDispatch } from '../../../hooks/suite';

const BASE_TRANSLATIONS = [{ value: 'en-US', label: LANGUAGES['en-US'].name as string }];

interface ChangeLanguageProps {
    isDeviceLocked: boolean;
}

export const ChangeLanguage = ({ isDeviceLocked }: ChangeLanguageProps) => {
    const { device } = useDevice();
    const dispatch = useDispatch();

    const onChange = ({ value }: { value: Locale }) => {
        dispatch(changeLanguage({ device, language: `${value}` }));
    };

    const isSupportedDevice = device?.features?.capabilities?.includes('Capability_Translations');

    const deviceSupportedTranslations = Object.keys(device?.availableTranslations ?? {})
        .map(it => {
            if (!LANGUAGES[it as Locale]) {
                console.error('LANGUAGES[it as Locale] not found', it);

                return null;
            }

            return {
                value: it,
                label: `${LANGUAGES[it as Locale].name} (beta)`,
            };
        })
        .filter((lang): lang is { value: string; label: string } => Boolean(lang));

    if (isSupportedDevice !== true || deviceSupportedTranslations.length === 0) {
        return null;
    }

    const languageOptions = BASE_TRANSLATIONS.concat(deviceSupportedTranslations);

    const selectedValue = languageOptions.find(
        option => option.value === device?.features?.language,
    );

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.FirmwareLanguage}>
            <TextColumn title={<Translation id="TR_LANGUAGE" />} />
            <ActionColumn>
                <ActionSelect
                    value={selectedValue}
                    options={languageOptions}
                    onChange={onChange}
                    isDisabled={isDeviceLocked}
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                    data-testid="@settings/device/firmware-language-select"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
