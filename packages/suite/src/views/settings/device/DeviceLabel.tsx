import React, { useState, useEffect } from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite';
import {
    ActionButton,
    ActionInput,
    ActionColumn,
    SectionItem,
    TextColumn,
} from 'src/components/suite/Settings';
import { useDevice, useActions } from 'src/hooks/suite';
import * as deviceSettingsActions from 'src/actions/settings/deviceSettingsActions';
import { MAX_LABEL_LENGTH } from 'src/constants/suite/device';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface DeviceLabelProps {
    isDeviceLocked: boolean;
}

export const DeviceLabel = ({ isDeviceLocked }: DeviceLabelProps) => {
    const { device } = useDevice();
    const { applySettings } = useActions({
        applySettings: deviceSettingsActions.applySettings,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.DeviceLabel);

    const [label, setLabel] = useState('');
    useEffect(() => {
        if (device) {
            setLabel(device.label);
        }
    }, [device]);

    return (
        <SectionItem
            data-test="@settings/device/device-label"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
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
                    inputState={label.length > MAX_LABEL_LENGTH ? 'error' : undefined}
                    onChange={(event: React.FormEvent<HTMLInputElement>) =>
                        setLabel(event.currentTarget.value)
                    }
                    data-test="@settings/device/label-input"
                    isDisabled={isDeviceLocked}
                />
                <ActionButton
                    onClick={() => {
                        applySettings({ label });
                        analytics.report({
                            type: EventType.SettingsDeviceChangeLabel,
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
