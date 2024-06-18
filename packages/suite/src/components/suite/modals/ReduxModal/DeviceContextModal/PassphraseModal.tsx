import { useCallback, useState } from 'react';

import { PassphraseTypeCard } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import {
    selectIsDiscoveryAuthConfirmationRequired,
    onPassphraseSubmit,
    selectDeviceModel,
    deviceActions,
} from '@suite-common/wallet-core';
import { useSelector, useDispatch } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import type { TrezorDevice } from 'src/types/suite';
import { OpenGuideFromTooltip } from 'src/components/guide';
import { SwitchDeviceRenderer } from 'src/views/suite/SwitchDevice/SwitchDeviceRenderer';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { PassphraseDescription } from './PassphraseDescription';
import { PassphraseWalletConfirmation } from './PassphraseWalletConfirmation';
import { PassphraseHeading } from './PassphraseHeading';
import { selectSuiteSettings } from '../../../../../reducers/suite/suiteReducer';

interface PassphraseModalProps {
    device: TrezorDevice;
}

export const PassphraseModal = ({ device }: PassphraseModalProps) => {
    const [submitted, setSubmitted] = useState(false);

    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device.authConfirm;

    const deviceModel = useSelector(selectDeviceModel);
    const settings = useSelector(selectSuiteSettings);

    const stateConfirmation = !!device.state;

    const onDeviceOffer = !!(
        device.features &&
        device.features.capabilities &&
        device.features.capabilities.includes('Capability_PassphraseEntry')
    );

    const dispatch = useDispatch();

    const onCancel = () => {
        TrezorConnect.cancel('auth-confirm-cancel'); // This auth-confirm-cancel' causes the proper cleaning of the state in deviceThunks.authConfirm()
        dispatch(deviceActions.forgetDevice({ device, settings }));
    };

    const onSubmit = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            setSubmitted(true);
            dispatch(onPassphraseSubmit({ value, passphraseOnDevice: !!passphraseOnDevice }));
        },
        [setSubmitted, dispatch],
    );

    if (submitted) {
        return null;
    }

    const isPassphraseWalletConfirmationVisible = authConfirmation || stateConfirmation;

    // show borderless one-column modal for confirming passphrase and state confirmation
    if (isPassphraseWalletConfirmationVisible) {
        return (
            <PassphraseWalletConfirmation
                onCancel={onCancel}
                onSubmit={onSubmit}
                onDeviceOffer={onDeviceOffer}
                device={device}
            />
        );
    }

    return (
        <SwitchDeviceRenderer>
            <CardWithDevice onCancel={onCancel} device={device}>
                <PassphraseHeading>
                    <Translation id="TR_PASSPHRASE_HIDDEN_WALLET" />
                </PassphraseHeading>

                <PassphraseDescription />
                <PassphraseTypeCard
                    title={<Translation id="TR_WALLET_SELECTION_HIDDEN_WALLET" />}
                    description={<Translation id="TR_HIDDEN_WALLET_DESCRIPTION" />}
                    submitLabel={<Translation id="TR_ACCESS_HIDDEN_WALLET" />}
                    type="hidden"
                    singleColModal
                    offerPassphraseOnDevice={onDeviceOffer}
                    onSubmit={onSubmit}
                    deviceModel={deviceModel ?? undefined}
                    learnMoreTooltipOnClick={
                        <OpenGuideFromTooltip
                            dataTest="@tooltip/guideAnchor"
                            id="/1_initialize-and-secure-your-trezor/6_passphrase.md"
                        />
                    }
                />
            </CardWithDevice>
        </SwitchDeviceRenderer>
    );
};
