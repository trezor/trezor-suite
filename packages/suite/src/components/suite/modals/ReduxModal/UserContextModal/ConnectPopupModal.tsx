import { H2, Paragraph, NewModal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

interface ConnectPopupModalProps {
    method: string;
    processName?: string;
    origin?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConnectPopupModal = ({
    method,
    processName,
    origin,
    onConfirm,
    onCancel,
}: ConnectPopupModalProps) => (
    <NewModal
        onCancel={onCancel}
        iconName="plugs"
        variant="primary"
        bottomContent={
            <>
                <NewModal.Button variant="tertiary" onClick={onCancel}>
                    <Translation id="TR_CANCEL" />
                </NewModal.Button>
                <NewModal.Button variant="primary" onClick={onConfirm}>
                    <Translation id="TR_CONFIRM" />
                </NewModal.Button>
            </>
        }
        heading={<Translation id="TR_TREZOR_CONNECT" />}
    >
        <H2>{method}</H2>

        {processName && (
            <Paragraph margin={{ top: spacings.xs }}>
                Process: <strong>{processName}</strong>
            </Paragraph>
        )}
        {origin && (
            <Paragraph>
                Web Origin: <strong>{origin}</strong>
            </Paragraph>
        )}

        <Paragraph variant="tertiary" margin={{ top: spacings.xs }}>
            A 3rd party application is trying to connect to your device. Do you want to allow this
            action?
        </Paragraph>
    </NewModal>
);
