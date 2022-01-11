import React, { useState, useEffect } from 'react';
import { Translation } from '@suite-components';
import {
    ActionButton,
    ActionInput,
    ActionColumn,
    SectionItem,
    TextColumn,
} from '@suite-components/Settings';
import { useDevice, useAnalytics, useActions } from '@suite-hooks';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { MAX_LABEL_LENGTH } from '@suite-constants/device';

interface Props {
    isDeviceLocked: boolean;
}

const DeviceLabel = ({ isDeviceLocked }: Props) => {
    const { device } = useDevice();
    const { applySettings } = useActions({
        applySettings: deviceSettingsActions.applySettings,
    });
    const analytics = useAnalytics();

    const [label, setLabel] = useState('');
    useEffect(() => {
        if (device) {
            setLabel(device.label);
        }
    }, [device]);

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_DEVICE_LABEL" />}
                description={
                    <Translation
                        id="TR_MAX_LABEL_LENGTH_IS"
                        values={{ length: MAX_LABEL_LENGTH }}
                    />
                }
            />
            <ActionColumn>
                <ActionInput
                    noTopLabel
                    noError
                    value={label}
                    state={label.length > MAX_LABEL_LENGTH ? 'error' : undefined}
                    onChange={(event: React.FormEvent<HTMLInputElement>) =>
                        setLabel(event.currentTarget.value)
                    }
                    data-test="@settings/device/label-input"
                    readOnly={isDeviceLocked}
                />
                <ActionButton
                    onClick={() => {
                        applySettings({ label });
                        analytics.report({
                            type: 'settings/device/change-label',
                        });
                    }}
                    isDisabled={
                        isDeviceLocked || label.length > MAX_LABEL_LENGTH || label === device?.label
                    }
                    data-test="@settings/device/label-submit"
                >
                    <Translation id="TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
export default DeviceLabel;
