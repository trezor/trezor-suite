import React from 'react';
import { Notification } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import suiteMessages from '@suite-views/index.messages';
import { getRoute } from '@suite-utils/router';
import { Props as BaseProps } from '../../index';

interface Props {
    device: BaseProps['suite']['device'];
    pathname: string;
    goto: BaseProps['goto'];
}

export default ({ device, pathname, goto }: Props) => {
    const needsBackup = device && device.features && device.features.needs_backup;
    if (!needsBackup) return null;
    if (pathname === getRoute('suite-device-backup')) return null;
    return (
        <Notification
            key="no-backup"
            variant="warning"
            title={<Translation {...suiteMessages.TR_YOUR_TREZOR_IS_NOT_BACKED_UP} />}
            message={<Translation {...suiteMessages.TR_IF_YOUR_DEVICE_IS_EVER_LOST} />}
            actions={[
                {
                    label: <Translation {...suiteMessages.TR_CREATE_BACKUP_IN_3_MINUTES} />,
                    // label: 'Create backup in 3 minutes',
                    callback: () => goto('suite-device-backup'),
                },
            ]}
        />
    );
};
