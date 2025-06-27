import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import {
    onPassphraseSubmit,
    selectDeviceModel,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { Column, H3, Paragraph } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import messages from 'src/support/messages';

import { PassphraseInputCard } from './PassphraseInputCard';
import { CardWithDevice } from '../../../../../views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from '../../../../../views/suite/SwitchDevice/SwitchDeviceModal';
import { Translation } from '../../../Translation';

export const ConfirmPassphraseBeforeAction = () => {
    const device = useSelector(selectSelectedDevice);
    const deviceModel = useSelector(selectDeviceModel);
    const dispatch = useDispatch();

    const intl = useIntl();

    const onEnterPassphraseDialogCancel = () =>
        TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    const onSubmit = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            dispatch(
                onPassphraseSubmit({
                    value,
                    passphraseOnDevice: !!passphraseOnDevice,
                }),
            );
        },
        [dispatch],
    );

    if (!device) {
        return null;
    }

    const onDeviceOffer = !!device?.features?.capabilities?.includes('Capability_PassphraseEntry');

    return (
        <SwitchDeviceModal onCancel={onEnterPassphraseDialogCancel}>
            <CardWithDevice
                onCancel={onEnterPassphraseDialogCancel}
                device={device}
                isFullHeaderVisible
            >
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
                        offerPassphraseOnDevice={onDeviceOffer}
                        allowNonAsciiCharacters
                    />
                </Column>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
