import { useCallback } from 'react';

import { Paragraph, Column, H3, List, Icon } from '@trezor/components';
import {
    selectIsDiscoveryAuthConfirmationRequired,
    onPassphraseSubmit,
    selectDeviceModel,
} from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';
import { PassphraseTypeCard } from '@trezor/product-components';
import { useSelector, useDispatch } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import type { TrezorDevice } from 'src/types/suite';
import { OpenGuideFromTooltip } from 'src/components/guide';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { PassphraseWalletConfirmation } from './PassphraseWalletConfirmation';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';
import { TrezorLink } from 'src/components/suite/TrezorLink';

interface PassphraseModalProps {
    device: TrezorDevice;
}

export const PassphraseModal = ({ device }: PassphraseModalProps) => {
    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device.authConfirm;

    const deviceModel = useSelector(selectDeviceModel);

    // @ts-expect-error device.state should not be ''
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

    return (
        <SwitchDeviceModal isAnimationEnabled onCancel={onEnterPassphraseDialogCancel}>
            {hasDeviceState ? (
                // "view-only" is active, device is reconnected and you fired an action that needs passphrase (e.g. add coin, show receive address)
                <CardWithDevice
                    onCancel={onEnterPassphraseDialogCancel}
                    device={device}
                    isFullHeaderVisible
                    icon="x"
                >
                    <Column gap={spacings.sm} margin={{ top: spacings.xxs }} alignItems="stretch">
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
            ) : (
                // first step of adding passphrase wallet from switch device modal
                <CardWithDevice
                    onCancel={onEnterPassphraseDialogCancel}
                    device={device}
                    onBackButtonClick={onEnterPassphraseDialogBack}
                    isFullHeaderVisible
                >
                    <Column gap={spacings.sm} margin={{ top: spacings.xxs }} alignItems="stretch">
                        <H3>
                            <Translation id="TR_PASSPHRASE_HIDDEN_WALLET" />
                        </H3>
                        <List gap={spacings.sm} bulletGap={spacings.md} typographyStyle="hint">
                            <List.Item bulletComponent={<Icon name="info" size={16} />}>
                                <Translation
                                    id="TR_PASSPHRASE_DESCRIPTION_ITEM1"
                                    values={{
                                        a: chunks => (
                                            <TrezorLink
                                                target="_blank"
                                                variant="underline"
                                                href={HELP_CENTER_PASSPHRASE_URL}
                                            >
                                                {chunks}
                                            </TrezorLink>
                                        ),
                                    }}
                                />
                            </List.Item>
                            <List.Item bulletComponent={<Icon name="asterisk" size={16} />}>
                                <Translation id="TR_PASSPHRASE_DESCRIPTION_ITEM2" />
                            </List.Item>
                            <List.Item bulletComponent={<Icon name="warningTriangle" size={16} />}>
                                <Translation id="TR_PASSPHRASE_DESCRIPTION_ITEM3" />
                            </List.Item>
                        </List>
                        <PassphraseTypeCard
                            submitLabel={<Translation id="TR_ACCESS_HIDDEN_WALLET" />}
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
            )}
        </SwitchDeviceModal>
    );
};
