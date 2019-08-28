import * as React from 'react';
import { injectIntl, InjectedIntlProps } from 'react-intl';
import { Notification } from '@trezor/components';
import l10nCommonMessages from '@suite-views/index.messages';
import { getRoute } from '@suite-utils/router';
import { goto } from '@suite-actions/routerActions';

import l10nMessages from './index.messages';
import { AppState } from '@suite-types';

interface Props extends InjectedIntlProps {
    device: AppState['suite']['device'];
    pathname: AppState['router']['pathname'];
}

const UpdateFirmware = ({ device, pathname, intl }: Props) => {
    if (!device || device.type !== 'acquired') return null;
    const outdated = ['outdated', 'required'].includes(device.firmware);
    if (!outdated) return null;

    // don't show notification when user is on firmware update page
    if (pathname === getRoute('suite-device-firmware')) return null;

    return (
        <Notification
            key="update-firmware"
            variant="warning"
            title={intl.formatMessage(l10nMessages.TR_NEW_TREZOR_FIRMWARE_IS_AVAILABLE_DOT)}
            message={intl.formatMessage(l10nCommonMessages.TR_UPGRADE_FOR_THE_NEWEST_FEATURES_DOT)}
            actions={[
                {
                    label: intl.formatMessage(l10nCommonMessages.TR_SHOW_DETAILS),
                    callback: () => goto(getRoute('suite-device-firmware')),
                },
            ]}
        />
    );
};

export default injectIntl(UpdateFirmware);
