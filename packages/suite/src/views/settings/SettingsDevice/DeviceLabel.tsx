import { useCallback } from 'react';
import { FormProvider } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { ActionColumn, TextColumn } from '@trezor/product-components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ChangeDeviceLabelForm } from 'src/components/suite/ChangeDeviceLabelForm';
import { MAX_LABEL_LENGTH } from 'src/constants/suite/device';
import { useChangeDeviceLabel } from 'src/hooks/suite/useChangeDeviceLabel';

type DeviceLabelProps = {
    isDeviceLocked: boolean;
};

export const DeviceLabel = ({ isDeviceLocked }: DeviceLabelProps) => {
    const { form, handleSubmit } = useChangeDeviceLabel();

    const onSubmit = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            handleSubmit();
        },
        [handleSubmit],
    );

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
                        onClick={onSubmit}
                    />
                </FormProvider>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
