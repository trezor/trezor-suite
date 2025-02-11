import { TrezorDevice } from '@suite-common/suite-types';
import { selectDeviceModel } from '@suite-common/wallet-core';
import { Column, H3, Paragraph } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { PassphraseTypeCard } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useSelector } from '../../../../../hooks/suite';
import { CardWithDevice } from '../../../../../views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from '../../../../../views/suite/SwitchDevice/SwitchDeviceModal';
import { OpenGuideFromTooltip } from '../../../../guide';
import { Translation } from '../../../Translation';

type ConfirmPassphraseBeforeActionProps = {
    onDeviceOffer: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    device: TrezorDevice;
};

export const ConfirmPassphraseBeforeAction = ({
    device,
    onSubmit,
    onDeviceOffer,
}: ConfirmPassphraseBeforeActionProps) => {
    const deviceModel = useSelector(selectDeviceModel);

    const onEnterPassphraseDialogCancel = () => {
        TrezorConnect.cancel('enter-passphrase-cancel');
    };

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
