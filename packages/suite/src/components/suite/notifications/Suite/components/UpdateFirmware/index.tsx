/* @flow */
import * as React from 'react';
import { injectIntl, InjectedIntlProps } from 'react-intl';
import { State } from '@suite-types/index';
import { Notification } from '@trezor/components';
import l10nCommonMessages from '@suite-views/index.messages';
import { getRoute } from '@suite-utils/router';
import { goto } from '@suite-actions/routerActions';

import l10nMessages from './index.messages';

interface Props extends InjectedIntlProps {
    device: State['suite']['device'];
    pathname: State['router']['pathname'];
}

const UpdateFirmware = ({ device, pathname, intl }: Props) => {
    const outdated = device && device.features && device.firmware === 'outdated';
    if (!outdated) return null;

    // don't show notification when user is on firmware update page
    if (pathname === getRoute('wallet-firmware-update')) return null;

    return (
        <Notification
            key="update-firmware"
            variant="warning"
            title={intl.formatMessage(l10nMessages.TR_NEW_TREZOR_FIRMWARE_IS_AVAILABLE_DOT)}
            message={intl.formatMessage(l10nCommonMessages.TR_UPGRADE_FOR_THE_NEWEST_FEATURES_DOT)}
            actions={[
                {
                    label: intl.formatMessage(l10nCommonMessages.TR_SHOW_DETAILS),
                    callback: goto(getRoute('suite-firmware-update')),
                },
            ]}
        />
    );
};

export default injectIntl(UpdateFirmware);
