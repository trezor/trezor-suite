import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { LANGUAGES, type Locale } from '@suite-common/suite-types';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@trezor/product-components';

import { changeLanguage } from 'src/actions/settings/deviceSettingsActions';
import { useDevice, useDispatch } from 'src/hooks/suite';

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
        <Anchor anchorId={SettingsAnchor.FirmwareLanguage}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn title={<Translation id="TR_LANGUAGE" />} />
                    <ActionColumn>
                        <ActionSelect
                            value={selectedValue}
                            options={languageOptions}
                            onChange={onChange}
                            isDisabled={isDeviceLocked}
                            isTooltipActive={isDeviceLocked}
                            tooltipContent={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                            data-testid="@settings/device/firmware-language-select"
                        />
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
