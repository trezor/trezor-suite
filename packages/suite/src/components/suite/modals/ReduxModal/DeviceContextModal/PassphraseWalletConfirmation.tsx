import { TrezorDevice } from '@suite-common/suite-types';
import { useState } from 'react';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceRenderer } from 'src/views/suite/SwitchDevice/SwitchDeviceRenderer';
import { PassphraseWalletConfirmationStep1 } from './PassphraseWalletConfirmationStep1';
import { PassphraseWalletConfirmationStep2 } from './PassphraseWalletConfirmationStep2';
import { PassphraseWalletConfirmationStep3 } from './PassphraseWalletConfirmationStep3';
import { ContentType } from './types';

type PassphraseWalletConfirmationContentProps = {
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    onDeviceOffer: boolean;
    onCancel: () => void;
};

type PassphraseWalletConfirmationProps = PassphraseWalletConfirmationContentProps & {
    device: TrezorDevice;
};

const PassphraseWalletConfirmationContent = ({
    onSubmit,
    onDeviceOffer,
    onCancel,
}: PassphraseWalletConfirmationContentProps): React.JSX.Element => {
    const [contentType, setContentType] = useState<ContentType>('step1');
    switch (contentType) {
        case 'step1':
            return (
                <PassphraseWalletConfirmationStep1
                    setContentType={setContentType}
                    onCancel={onCancel}
                />
            );
        case 'step2':
            return <PassphraseWalletConfirmationStep2 setContentType={setContentType} />;
        case 'step3':
            return (
                <PassphraseWalletConfirmationStep3
                    onDeviceOffer={onDeviceOffer}
                    onSubmit={onSubmit}
                />
            );
    }
};

export const PassphraseWalletConfirmation = ({
    onCancel,
    onSubmit,
    onDeviceOffer,
    device,
}: PassphraseWalletConfirmationProps) => (
    <SwitchDeviceRenderer isCancelable onCancel={onCancel}>
        <CardWithDevice onCancel={onCancel} device={device}>
            <PassphraseWalletConfirmationContent
                onSubmit={onSubmit}
                onDeviceOffer={onDeviceOffer}
                onCancel={onCancel}
            />
        </CardWithDevice>
    </SwitchDeviceRenderer>
);
