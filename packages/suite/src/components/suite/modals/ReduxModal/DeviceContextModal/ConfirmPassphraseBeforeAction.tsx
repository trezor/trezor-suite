import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import {
    onPassphraseSubmit,
    selectDeviceModel,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { Column, H3, Paragraph } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { PassphraseTypeCard } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import messages from 'src/support/messages';

import { CardWithDevice } from '../../../../../views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from '../../../../../views/suite/SwitchDevice/SwitchDeviceModal';
import { OpenGuideFromTooltip } from '../../../../guide';
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
        <SwitchDeviceModal isAnimationEnabled onCancel={onEnterPassphraseDialogCancel}>
            <CardWithDevice
                onCancel={onEnterPassphraseDialogCancel}
                device={device}
                isFullHeaderVisible
                icon="x"
            >
                <Column gap={spacings.sm} margin={{ top: spacings.xxs }}>
                    <H3>
                        <Translation id="TR_CONFIRM_PASSPHRASE" />
                    </H3>
                    <Paragraph>
                        <Translation id="TR_CONFIRM_PASSPHRASE_WITHOUT_ADVICE_DESCRIPTION" />
                    </Paragraph>
                    <PassphraseTypeCard
                        submitLabel={<Translation id="TR_CONFIRM" />}
                        type="hidden"
                        singleColModal
                        offerPassphraseOnDevice={onDeviceOffer}
                        onSubmit={onSubmit}
                        deviceModel={deviceModel ?? undefined}
                        deviceBackup={device.features?.backup_type}
                        learnMoreTooltipOnClick={
                            <OpenGuideFromTooltip
                                data-testid="@tooltip/guideAnchor"
                                id="/1_initialize-and-secure-your-trezor/6_passphrase.md"
                            />
                        }
                    />
                </Column>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
