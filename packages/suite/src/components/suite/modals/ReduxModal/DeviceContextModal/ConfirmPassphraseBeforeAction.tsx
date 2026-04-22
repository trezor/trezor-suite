import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { Translation, messages } from '@suite/intl';
import { selectModalRequestId } from '@suite/modal';
import {
    selectDeviceModel,
    selectHasDevicePassphraseEntryCapability,
    selectSelectedDevice,
} from '@suite-common/device';
import { Column, H3, Paragraph } from '@trezor/components';
import TrezorConnect, { UI_RESPONSE } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';

import { PassphraseInputCard } from './PassphraseInputCard';

export const ConfirmPassphraseBeforeAction = () => {
    const device = useSelector(selectSelectedDevice);
    const deviceModel = useSelector(selectDeviceModel);
    const requestId = useSelector(selectModalRequestId);

    const intl = useIntl();

    const onEnterPassphraseDialogCancel = () =>
        TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    const onSubmit = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            TrezorConnect.uiResponse({
                type: UI_RESPONSE.RECEIVE_PASSPHRASE,
                payload: {
                    value,
                    save: true,
                    passphraseOnDevice: !!passphraseOnDevice,
                },
                requestId,
            });
        },
        [requestId],
    );

    const offerPassphraseOnDevice = useSelector(selectHasDevicePassphraseEntryCapability);

    if (!device) {
        return null;
    }

    return (
        <SwitchDeviceModal onCancel={onEnterPassphraseDialogCancel}>
            <CardWithDevice onCancel={onEnterPassphraseDialogCancel} device={device}>
                <Column gap={8} padding={{ horizontal: 8 }} margin={{ bottom: 16 }}>
                    <H3>
                        <Translation id="TR_CONFIRM_PASSPHRASE" />
                    </H3>
                    <Paragraph>
                        <Translation id="TR_CONFIRM_PASSPHRASE_WITHOUT_ADVICE_DESCRIPTION" />
                    </Paragraph>
                </Column>
                <PassphraseInputCard
                    deviceModel={deviceModel ?? undefined}
                    onSubmit={onSubmit}
                    offerPassphraseOnDevice={offerPassphraseOnDevice}
                    allowNonAsciiCharacters
                />
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
