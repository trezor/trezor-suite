import { FormProvider } from 'react-hook-form';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { ChangeDeviceLabelForm } from 'src/components/suite/ChangeDeviceLabelForm';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { MAX_LABEL_LENGTH } from 'src/constants/suite/device';
import { useChangeDeviceLabel } from 'src/hooks/suite/useChangeDeviceLabel';

type DeviceLabelProps = {
    isDeviceLocked: boolean;
};

export const DeviceLabel = ({ isDeviceLocked }: DeviceLabelProps) => {
    const { form, onSubmit } = useChangeDeviceLabel();

    const handleClick = async () => {
        await onSubmit();
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.DeviceLabel}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_DEVICE_LABEL" />}
                description={
                    <Translation id="TR_LABEL_REQUIREMENTS" values={{ length: MAX_LABEL_LENGTH }} />
                }
            />
            <ActionColumn>
                <FormProvider {...form}>
                    <ChangeDeviceLabelForm
                        isVertical
                        isDeviceLocked={isDeviceLocked}
                        onClick={handleClick}
                    />
                </FormProvider>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
