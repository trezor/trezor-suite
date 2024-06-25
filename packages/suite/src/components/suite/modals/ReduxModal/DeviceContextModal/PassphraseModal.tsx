import { useCallback, useState } from 'react';

import { PassphraseTypeCard } from '@trezor/components';
import {
    selectIsDiscoveryAuthConfirmationRequired,
    onPassphraseSubmit,
    selectDeviceModel,
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
import TrezorConnect from '@trezor/connect';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';

const MarginContainer = styled.div`
    margin: 0 ${spacingsPx.sm};
`;

interface PassphraseModalProps {
    device: TrezorDevice;
}

export const PassphraseModal = ({ device }: PassphraseModalProps) => {
    const { isViewOnlyModeVisible } = useSelector(selectSuiteFlags);
    const [submitted, setSubmitted] = useState(false);

    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device.authConfirm;

    const deviceModel = useSelector(selectDeviceModel);

    const stateConfirmation = !!device.state;

    const onDeviceOffer = !!(
        device.features &&
        device.features.capabilities &&
        device.features.capabilities.includes('Capability_PassphraseEntry')
    );

    const dispatch = useDispatch();

    const onConfirmPassphraseDialogCancel = () => {
        TrezorConnect.cancel('auth-confirm-cancel');
    };

    const onConfirmPassphraseDialogRetry = () => {
        TrezorConnect.cancel('auth-confirm-retry');
    };

    const onEnterPassphraseDialogCancel = () => {
        TrezorConnect.cancel('enter-passphrase-cancel');
    };
    const onEnterPassphraseDialogBack = () => {
        TrezorConnect.cancel('enter-passphrase-back');
    };

    const onSubmit = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            if (!isViewOnlyModeVisible) {
                setSubmitted(true);
            }
            dispatch(onPassphraseSubmit({ value, passphraseOnDevice: !!passphraseOnDevice }));
        },
        [dispatch, setSubmitted, isViewOnlyModeVisible],
    );

    if (!isViewOnlyModeVisible && submitted) {
        return null;
    }

    const isPassphraseWalletConfirmationVisible = authConfirmation || stateConfirmation;

    // show borderless one-column modal for confirming passphrase and state confirmation
    if (isPassphraseWalletConfirmationVisible) {
        return (
            <PassphraseWalletConfirmation
                onCancel={onConfirmPassphraseDialogCancel}
                onSubmit={onSubmit}
                onDeviceOffer={onDeviceOffer}
                device={device}
                onRetry={onConfirmPassphraseDialogRetry}
            />
        );
    }

    return (
        <SwitchDeviceRenderer isCancelable onCancel={onEnterPassphraseDialogCancel}>
            <CardWithDevice
                onCancel={onEnterPassphraseDialogCancel}
                device={device}
                onBackButtonClick={onEnterPassphraseDialogBack}
                isCloseButtonVisible
            >
                <MarginContainer>
                    <PassphraseHeading>
                        <Translation id="TR_PASSPHRASE_HIDDEN_WALLET" />
                    </PassphraseHeading>

                    <PassphraseDescription />
                </MarginContainer>
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
