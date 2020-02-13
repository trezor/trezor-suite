import * as React from 'react';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import { Button, colors } from '@trezor/components-v2';
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

    const outdated = ['outdated'].includes(device.firmware);
    if (!outdated) return null;

    return (
        <Wrapper variant="info">
            <Translation {...messages.TR_NEW_TREZOR_FIRMWARE_IS_AVAILABLE_DOT} />
            <Button
                variant="tertiary"
                color={colors.WHITE}
                onClick={() => goto('firmware-index')}
                data-test="@notification/update-firmware/button"
            >
                <Translation {...messages.TR_SHOW_DETAILS} />
            </Button>
        </Wrapper>
    );
};

export default UpdateFirmware;
