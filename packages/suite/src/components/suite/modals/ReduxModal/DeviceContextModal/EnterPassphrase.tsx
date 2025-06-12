import { TrezorDevice } from '@suite-common/suite-types';
import { selectDeviceModel } from '@suite-common/wallet-core';
import { Column, H3, Icon, List } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';

import { PassphraseInputCard } from './PassphraseInputCard';
import { useSelector } from '../../../../../hooks/suite';
import { CardWithDevice } from '../../../../../views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from '../../../../../views/suite/SwitchDevice/SwitchDeviceModal';
import { Translation } from '../../../Translation';
import { TrezorLink } from '../../../TrezorLink';

type EnterPassphraseProps = {
    onDeviceOffer: boolean;
    device: TrezorDevice;
    deviceLoading?: boolean;
    submitting?: boolean;
    isExistingWallet?: boolean;
    onBack: () => void;
    onCancel: () => void;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
};

export const EnterPassphrase = ({
    device,
    deviceLoading,
    onDeviceOffer,
    isExistingWallet = false,
    onBack,
    onCancel,
    onSubmit,
}: EnterPassphraseProps) => {
    const deviceModel = useSelector(selectDeviceModel);

    return (
        <SwitchDeviceModal isAnimationEnabled onCancel={onCancel}>
            <CardWithDevice
                onCancel={onCancel}
                device={device}
                onBackButtonClick={onBack}
                isFullHeaderVisible
            >
                <Column gap={spacings.sm}>
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
                                            typographyStyle="hint"
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
                        <List.Item bulletComponent={<Icon name="warning" size={16} />}>
                            <Translation id="TR_PASSPHRASE_DESCRIPTION_ITEM3" />
                        </List.Item>
                    </List>
                    <PassphraseInputCard
                        deviceModel={deviceModel ?? undefined}
                        deviceLoading={deviceLoading}
                        onSubmit={onSubmit}
                        offerPassphraseOnDevice={onDeviceOffer}
                        allowNonAsciiCharacters={isExistingWallet}
                    />
                </Column>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
