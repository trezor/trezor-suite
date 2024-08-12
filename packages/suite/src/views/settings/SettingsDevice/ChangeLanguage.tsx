import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, ActionSelect, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from '../../../constants/suite/anchors';
import { useDevice, useDispatch } from '../../../hooks/suite';
import { changeLanguage } from '../../../actions/settings/deviceSettingsActions';
import { LANGUAGES } from '../../../config/suite';
import { Locale } from '../../../config/suite/languages';

const BASE_TRANSLATIONS = [{ value: 'en-US', label: LANGUAGES['en'].name }];

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
        <SettingsSectionItem anchorId={SettingsAnchor.FirmwareLanguage}>
            <TextColumn title={<Translation id="TR_LANGUAGE" />} />
            <ActionColumn>
                <ActionSelect
                    useKeyPressScroll
                    value={selectedValue}
                    options={languageOptions}
                    onChange={onChange}
                    isDisabled={isDeviceLocked}
                    data-testid="@settings/device/firmware-language-select"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
