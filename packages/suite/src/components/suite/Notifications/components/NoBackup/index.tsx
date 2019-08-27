import React from 'react';
import { Notification } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from '@suite-views/index.messages';
import { goto } from '@suite-actions/routerActions';
import { getRoute } from '@suite-utils/router';
import { AppState } from '@suite-types';

interface Props {
    device: AppState['suite']['device'];
    pathname: string;
}

export default ({ device, pathname }: Props) => {
    const needsBackup = device && device.features && device.features.needs_backup;
    if (!needsBackup) return null;
    if (pathname === getRoute('suite-device-backup')) return null;
    return (
        <Notification
            key="no-backup"
            variant="warning"
            title={<FormattedMessage {...l10nCommonMessages.TR_YOUR_TREZOR_IS_NOT_BACKED_UP} />}
            message={<FormattedMessage {...l10nCommonMessages.TR_IF_YOUR_DEVICE_IS_EVER_LOST} />}
            actions={[
                {
                    // label: (
                    //     <FormattedMessage {...l10nCommonMessages.TR_CREATE_BACKUP_IN_3_MINUTES} />
                    // ),
                    label: 'Create backup in 3 minutes',
                    callback: () => goto(getRoute('suite-device-backup')),
                },
            ]}
        />
    );
};
