import { TrezorDevice } from '@suite-common/suite-types/libDev/src';
import { selectDeviceModel } from '@suite-common/wallet-core';
import { Column, H3, Icon, List } from '@trezor/components';
import { PassphraseTypeCard } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';

import { useSelector } from '../../../../../hooks/suite';
import { CardWithDevice } from '../../../../../views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from '../../../../../views/suite/SwitchDevice/SwitchDeviceModal';
import { OpenGuideFromTooltip } from '../../../../guide';
import { Translation } from '../../../Translation';
import { TrezorLink } from '../../../TrezorLink';

type EnterPassphraseProps = {
    onDeviceOffer: boolean;
    device: TrezorDevice;
    deviceLoading?: boolean;
    onBack: () => void;
    onCancel: () => void;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
};

export const EnterPassphrase = ({
    device,
    deviceLoading,
    onDeviceOffer,
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
                <Column gap={spacings.sm} margin={{ top: spacings.xxs }}>
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
                    <PassphraseTypeCard
                        deviceLoading={deviceLoading}
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
        </SwitchDeviceModal>
    );
};
