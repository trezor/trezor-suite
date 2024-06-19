import { TrezorDevice } from '@suite-common/suite-types';
import { Dispatch, SetStateAction, useState } from 'react';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceRenderer } from 'src/views/suite/SwitchDevice/SwitchDeviceRenderer';
import { PassphraseWalletConfirmationStep1 } from './PassphraseWalletConfirmationStep1';
import { PassphraseWalletConfirmationStep2 } from './PassphraseWalletConfirmationStep2';
import { PassphraseWalletConfirmationStep3 } from './PassphraseWalletConfirmationStep3';
import { ContentType } from './types';

type PassphraseWalletConfirmationCommonProps = {
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    onDeviceOffer: boolean;
    onCancel: () => void;
};

type PassphraseWalletConfirmationContentProps = PassphraseWalletConfirmationCommonProps & {
    contentType: ContentType;
    setContentType: Dispatch<SetStateAction<ContentType>>;
};

type PassphraseWalletConfirmationProps = PassphraseWalletConfirmationCommonProps & {
    device: TrezorDevice;
};

const PassphraseWalletConfirmationContent = ({
    onSubmit,
    onDeviceOffer,
    onCancel,
    contentType,
    setContentType,
}: PassphraseWalletConfirmationContentProps): React.JSX.Element => {
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
}: PassphraseWalletConfirmationProps) => {
    const [contentType, setContentType] = useState<ContentType>('step1');
    const handleBackButtonClick = () => {
        switch (contentType) {
            case 'step3':
                setContentType('step2');

                return;
            case 'step2':
                setContentType('step1');

                return;
            default:
                onCancel();

                return;
        }
    };

    return (
        <SwitchDeviceRenderer isCancelable onCancel={onCancel}>
            <CardWithDevice
                onCancel={onCancel}
                device={device}
                onBackButtonClick={handleBackButtonClick}
            >
                <PassphraseWalletConfirmationContent
                    onSubmit={onSubmit}
                    onDeviceOffer={onDeviceOffer}
                    contentType={contentType}
                    setContentType={setContentType}
                    onCancel={onCancel}
                />
            </CardWithDevice>
        </SwitchDeviceRenderer>
    );
};
