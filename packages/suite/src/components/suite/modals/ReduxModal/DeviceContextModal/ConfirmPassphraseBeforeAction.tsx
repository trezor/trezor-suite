import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import {
    selectDeviceModel,
    selectHasDevicePassphraseEntryCapability,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { Column, H3, Paragraph } from '@trezor/components';
import TrezorConnect, { UI } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import messages from 'src/support/messages';

import { PassphraseInputCard } from './PassphraseInputCard';
import { CardWithDevice } from '../../../../../views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from '../../../../../views/suite/SwitchDevice/SwitchDeviceModal';
import { Translation } from '../../../Translation';

export const ConfirmPassphraseBeforeAction = () => {
    const device = useSelector(selectSelectedDevice);
    const deviceModel = useSelector(selectDeviceModel);

    const intl = useIntl();

    const onEnterPassphraseDialogCancel = () =>
        TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    const onSubmit = useCallback((value: string, passphraseOnDevice?: boolean) => {
        TrezorConnect.uiResponse({
            type: UI.RECEIVE_PASSPHRASE,
            payload: {
                value,
                save: true,
                passphraseOnDevice: !!passphraseOnDevice,
            },
        });
    }, []);

    const offerPassphraseOnDevice = useSelector(selectHasDevicePassphraseEntryCapability);

    if (!device) {
        return null;
    }

    return (
        <SwitchDeviceModal onCancel={onEnterPassphraseDialogCancel}>
            <CardWithDevice onCancel={onEnterPassphraseDialogCancel} device={device}>
                <Column gap={spacings.sm}>
                    <H3>
                        <Translation id="TR_CONFIRM_PASSPHRASE" />
                    </H3>
                    <Paragraph>
                        <Translation id="TR_CONFIRM_PASSPHRASE_WITHOUT_ADVICE_DESCRIPTION" />
                    </Paragraph>
                    <PassphraseInputCard
                        deviceModel={deviceModel ?? undefined}
                        onSubmit={onSubmit}
                        offerPassphraseOnDevice={offerPassphraseOnDevice}
                        allowNonAsciiCharacters
                    />
                </Column>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
