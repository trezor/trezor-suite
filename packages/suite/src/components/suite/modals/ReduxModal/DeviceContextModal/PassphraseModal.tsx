import { useCallback } from 'react';

import { Text } from '@trezor/components';
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
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';
import { PassphraseTypeCard } from '@trezor/product-components';

const MarginContainer = styled.div`
    margin: 0 ${spacingsPx.sm};
`;

interface PassphraseModalProps {
    device: TrezorDevice;
}

export const PassphraseModal = ({ device }: PassphraseModalProps) => {
    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device.authConfirm;

    const deviceModel = useSelector(selectDeviceModel);

    const hasDeviceState = device.state !== undefined && device.state !== '';

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
            dispatch(onPassphraseSubmit({ value, passphraseOnDevice: !!passphraseOnDevice }));
        },
        [dispatch],
    );

    // passphrase needs to be confirmed because wallet is empty
    if (authConfirmation) {
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

    // "view-only" is active, device is reconnected and you fired an action that needs passphrase (e.g. add coin, show receive address)
    if (hasDeviceState) {
        return (
            <SwitchDeviceRenderer isCancelable onCancel={onEnterPassphraseDialogCancel}>
                <CardWithDevice
                    onCancel={onEnterPassphraseDialogCancel}
                    device={device}
                    isFullHeaderVisible
                    icon="close"
                >
                    <MarginContainer>
                        <PassphraseHeading>
                            <Translation id="TR_CONFIRM_PASSPHRASE" />
                        </PassphraseHeading>

                        <Text>
                            <Translation id="TR_CONFIRM_PASSPHRASE_WITHOUT_ADVICE_DESCRIPTION" />
                        </Text>
                    </MarginContainer>
                    <PassphraseTypeCard
                        submitLabel={<Translation id="TR_CONFIRM" />}
                        type="hidden"
                        singleColModal
                        offerPassphraseOnDevice={onDeviceOffer}
                        onSubmit={onSubmit}
                        deviceModel={deviceModel ?? undefined}
                        learnMoreTooltipOnClick={
                            <OpenGuideFromTooltip
                                data-testid="@tooltip/guideAnchor"
                                id="/1_initialize-and-secure-your-trezor/6_passphrase.md"
                            />
                        }
                    />
                </CardWithDevice>
            </SwitchDeviceRenderer>
        );
    }

    // first step of adding passphrase wallet from switch device modal
    return (
        <SwitchDeviceRenderer isCancelable onCancel={onEnterPassphraseDialogCancel}>
            <CardWithDevice
                onCancel={onEnterPassphraseDialogCancel}
                device={device}
                onBackButtonClick={onEnterPassphraseDialogBack}
                isFullHeaderVisible
            >
                <MarginContainer>
                    <PassphraseHeading>
                        <Translation id="TR_PASSPHRASE_HIDDEN_WALLET" />
                    </PassphraseHeading>

                    <PassphraseDescription />
                </MarginContainer>
                <PassphraseTypeCard
                    submitLabel={<Translation id="TR_ACCESS_HIDDEN_WALLET" />}
                    type="hidden"
                    singleColModal
                    offerPassphraseOnDevice={onDeviceOffer}
                    onSubmit={onSubmit}
                    deviceModel={deviceModel ?? undefined}
                    learnMoreTooltipOnClick={
                        <OpenGuideFromTooltip
                            data-testid="@tooltip/guideAnchor"
                            id="/1_initialize-and-secure-your-trezor/6_passphrase.md"
                        />
                    }
                />
            </CardWithDevice>
        </SwitchDeviceRenderer>
    );
};
