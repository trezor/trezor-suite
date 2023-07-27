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
import { useDevice, useDispatch, useTranslation } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { MAX_LABEL_LENGTH } from 'src/constants/suite/device';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { isAscii } from '@trezor/utils';

interface DeviceLabelProps {
    isDeviceLocked: boolean;
}

export const DeviceLabel = ({ isDeviceLocked }: DeviceLabelProps) => {
    const [label, setLabel] = useState('');
    const dispatch = useDispatch();
    const { device } = useDevice();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.DeviceLabel);
    const { translationString } = useTranslation();

    const handleButtonClick = () => {
        dispatch(applySettings({ label }));
        analytics.report({
            type: EventType.SettingsDeviceChangeLabel,
        });
    };
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (device) {
            setLabel(device.label);
        }
    }, [device]);

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = ({ target: { value } }) => {
        setLabel(value);

        if (value.length > MAX_LABEL_LENGTH) {
            setError(
                translationString('TR_LABEL_ERROR_LENGTH', {
                    length: 16,
                }),
            );
        } else if (!isAscii(value)) {
            setError(translationString('TR_LABEL_ERROR_CHARACTERS'));
        } else {
            setError(null);
        }
    };

    return (
        <SectionItem
            data-test="@settings/device/device-label"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_DEVICE_LABEL" />}
                description={
                    <Translation id="TR_LABEL_REQUIREMENTS" values={{ length: MAX_LABEL_LENGTH }} />
                }
            />
            <ActionColumn>
                <ActionInput
                    noTopLabel
                    bottomText={error}
                    value={label}
                    inputState={error ? 'error' : undefined}
                    onChange={handleChange}
                    data-test="@settings/device/label-input"
                    isDisabled={isDeviceLocked}
                />
                <ActionButton
                    onClick={handleButtonClick}
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
