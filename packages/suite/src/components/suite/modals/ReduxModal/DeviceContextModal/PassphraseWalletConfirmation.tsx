import { TrezorDevice } from '@suite-common/suite-types';
import { Dispatch, SetStateAction, useState } from 'react';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';
import { PassphraseWalletConfirmationStep1 } from './PassphraseWalletConfirmationStep1';
import { PassphraseWalletConfirmationStep2 } from './PassphraseWalletConfirmationStep2';
import { PassphraseWalletConfirmationStep3 } from './PassphraseWalletConfirmationStep3';
import { ContentType } from './types';

type PassphraseWalletConfirmationContentProps = {
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    onDeviceOffer: boolean;
    onRetry: () => void;
    onCancel: () => void;
    contentType: ContentType;
    setContentType: Dispatch<SetStateAction<ContentType>>;
};

const PassphraseWalletConfirmationContent = ({
    onSubmit,
    onDeviceOffer,
    onRetry,
    onCancel,
    contentType,
    setContentType,
}: PassphraseWalletConfirmationContentProps): React.JSX.Element => {
    switch (contentType) {
        case 'step1':
            return (
                <PassphraseWalletConfirmationStep1
                    setContentType={setContentType}
                    onRetry={onRetry}
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

type PassphraseWalletConfirmationProps = {
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    onDeviceOffer: boolean;
    onCancel: () => void;
    onRetry: () => void;
    device: TrezorDevice;
};

export const PassphraseWalletConfirmation = ({
    onCancel,
    onRetry,
    onSubmit,
    onDeviceOffer,
    device,
}: PassphraseWalletConfirmationProps) => {
    const [contentType, setContentType] = useState<ContentType>('step1');

    const handleBackButtonClick = () => {
        const map: Record<ContentType, () => void> = {
            step1: onRetry,
            step2: () => setContentType('step1'),
            step3: () => setContentType('step2'),
        };

        map[contentType]();
    };

    return (
        <SwitchDeviceModal onCancel={onCancel}>
            <CardWithDevice
                onCancel={onCancel}
                device={device}
                onBackButtonClick={handleBackButtonClick}
                isFullHeaderVisible
            >
                <PassphraseWalletConfirmationContent
                    onSubmit={onSubmit}
                    onDeviceOffer={onDeviceOffer}
                    contentType={contentType}
                    setContentType={setContentType}
                    onRetry={onRetry}
                    onCancel={onCancel}
                />
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
