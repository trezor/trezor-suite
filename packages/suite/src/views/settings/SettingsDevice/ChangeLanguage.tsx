import React from 'react';
import {
    ActionColumn,
    ActionSelect,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useAnchor } from '../../../hooks/suite/useAnchor';
import { SettingsAnchor } from '../../../constants/suite/anchors';
import { useDevice, useDispatch } from '../../../hooks/suite';
import { changeLanguage } from '../../../actions/settings/deviceSettingsActions';
import { LANGUAGES } from '../../../config/suite';
import { Locale } from '../../../config/suite/languages';

const BASE_TRANSLATIONS = [{ value: 'en-US', label: LANGUAGES['en'].name }];

interface Props {
    isDeviceLocked: boolean;
}

export const ChangeLanguage = ({ isDeviceLocked }: Props) => {
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.FirmwareLanguage);
    const { device } = useDevice();
    const dispatch = useDispatch();

    const onChange = ({ value }: { value: Locale }) => {
        dispatch(changeLanguage({ device, language: `${value}` }));
    };

    const isSupportedDevice = device?.features?.capabilities?.includes('Capability_Translations');

    const deviceSupportedTranslations = (device?.availableTranslations ?? []).map(it => ({
        value: it,
        label: `${LANGUAGES[it.split('-')[0] as Locale].name} (beta)`,
    }));

    if (isSupportedDevice !== true || deviceSupportedTranslations.length === 0) {
        return null;
    }

    const languageOptions = BASE_TRANSLATIONS.concat(deviceSupportedTranslations);

    const selectedValue = languageOptions.find(
        option => option.value === device?.features?.language,
    );

    return (
        <SectionItem
            data-test="@settings/device/language"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn title={<Translation id="TR_LANGUAGE" />} />
            <ActionColumn>
                <ActionSelect
                    useKeyPressScroll
                    value={selectedValue}
                    options={languageOptions}
                    onChange={onChange}
                    isDisabled={isDeviceLocked}
                    data-test="@settings/device/firmware-language-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};
