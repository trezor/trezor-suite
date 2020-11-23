import * as React from 'react';
import { Translation } from '@suite-components';

import { Button } from '@trezor/components';
import Wrapper from './components/Wrapper';
import { Props as BaseProps } from './index';

interface Props {
    device: BaseProps['suite']['device'];
    goto: BaseProps['goto'];
}

const UpdateFirmware = ({ device, goto }: Props) => {
    if (!device || device.type !== 'acquired' || !device.connected) return null;

    // in bootloader, we don't see firmware version (not true from model T), but still, we probably
    // don't want to show this notification
    if (device.mode === 'bootloader') return null;

    // backup is more important than firmware
    if (device.features.unfinished_backup || device.features.needs_backup) return null;

    const outdated = ['outdated'].includes(device.firmware);
    if (!outdated) return null;

    return (
        <Wrapper variant="info">
            <Translation id="TR_NEW_TREZOR_FIRMWARE_IS_AVAILABLE_DOT" />
            <Button
                variant="tertiary"
                onClick={() => goto('firmware-index')}
                data-test="@notification/update-firmware/button"
            >
                <Translation id="TR_SHOW_DETAILS" />
            </Button>
        </Wrapper>
    );
};

export default UpdateFirmware;
