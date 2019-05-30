/* @flow */
import * as React from 'react';
import { Notification } from 'trezor-ui-components';
import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from 'views/common.messages';
import type { Props } from '../../index';

export default (props: Props) => {
    const { selectedDevice } = props.wallet;
    const needsBackup =
        selectedDevice && selectedDevice.features && selectedDevice.features.needs_backup;
    if (!needsBackup) return null;
    return (
        <Notification
            key="no-backup"
            variant="warning"
            title={<FormattedMessage {...l10nCommonMessages.TR_YOUR_TREZOR_IS_NOT_BACKED_UP} />}
            message={<FormattedMessage {...l10nCommonMessages.TR_IF_YOUR_DEVICE_IS_EVER_LOST} />}
            actions={[
                {
                    label: (
                        <FormattedMessage {...l10nCommonMessages.TR_CREATE_BACKUP_IN_3_MINUTES} />
                    ),
                    callback: props.routerActions.gotoBackup,
                },
            ]}
        />
    );
};
