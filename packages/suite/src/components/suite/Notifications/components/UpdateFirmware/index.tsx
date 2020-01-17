import { getRoute } from '@suite-utils/router';
import messages from '@suite/support/messages';
import { Notification } from '@trezor/components';
import * as React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';

import { Props as BaseProps } from '../../index';

interface Props extends WrappedComponentProps {
    device: BaseProps['suite']['device'];
    pathname: string;
    goto: BaseProps['goto'];
}

const UpdateFirmware = ({ device, pathname, intl, goto }: Props) => {
    if (!device || device.type !== 'acquired') return null;
    // don't show notification when user is on firmware update page
    if (pathname === getRoute('firmware-index')) return null;

    // in bootloader, we dont see firmware version (not true from model T), but still, we probably
    // dont want to show this notification
    if (device.mode === 'bootloader') return null;

    const outdated = ['outdated'].includes(device.firmware);
    if (!outdated) return null;

    return (
        <Notification
            key="update-firmware"
            variant="warning"
            title={intl.formatMessage(messages.TR_NEW_TREZOR_FIRMWARE_IS_AVAILABLE_DOT)}
            message={intl.formatMessage(messages.TR_UPGRADE_FOR_THE_NEWEST_FEATURES_DOT)}
            actions={[
                {
                    label: intl.formatMessage(messages.TR_SHOW_DETAILS),
                    callback: () => goto('firmware-index'),
                },
            ]}
        />
    );
};

export default injectIntl(UpdateFirmware);
