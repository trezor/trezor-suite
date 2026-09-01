import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { selectSupportedDeviceLanguages } from '@suite-common/device';
import { type Locale } from '@suite-common/suite-types';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@trezor/product-components';

import { changeLanguage } from 'src/actions/settings/deviceSettingsActions';
import { useSelector } from 'src/hooks/suite';

interface ChangeLanguageProps {
    isDeviceLocked: boolean;
}

export const ChangeLanguage = ({ isDeviceLocked }: ChangeLanguageProps) => {
    const { device } = useDevice();
    const dispatch = useDispatch();

    const supportedDeviceLanguages = useSelector(selectSupportedDeviceLanguages);

    const onChange = ({ value }: { value: Locale }) => {
        dispatch(changeLanguage({ device, language: value }));
    };

    const languageOptions = useMemo(
        () =>
            supportedDeviceLanguages.map(({ value, label, isBeta }) => ({
                value,
                label: label + (isBeta ? ' (beta)' : ''),
            })),
        [supportedDeviceLanguages],
    );

    if (supportedDeviceLanguages.length <= 1) {
        return null;
    }

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
