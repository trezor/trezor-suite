import { type ReactNode, useState } from 'react';
import { useZxing } from 'react-zxing';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type UserContextPayload } from '@suite-common/suite-types';
import { Card, Column, Icon, Modal, type ModalProps, Paragraph, Row } from '@trezor/components';
import { borders, spacings } from '@trezor/theme';
import { HELP_CENTER_QR_CODE_URL } from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

const ContentWrapper = styled.div`
    height: 380px;
`;

const ReaderWrapper = styled.div<{ $isVisible: boolean }>`
    display: ${({ $isVisible }) => !$isVisible && 'none'};
    height: 100%;
`;

const StyledVideo = styled.video`
    width: 100%;
    height: 100%;
    position: relative;
    border-radius: ${borders.radii.md};

    @media (min-width: 768px) {
        transform: scaleX(-1);
    }
`;

type QrScannerModalProps = Pick<Extract<UserContextPayload, { type: 'qr-reader' }>, 'decision'> &
    Required<Pick<ModalProps, 'onCancel'>>;

export const QrScannerModal = ({ decision, onCancel }: QrScannerModalProps) => {
    const [readerLoaded, setReaderLoaded] = useState(false);
    const [error, setError] = useState<ReactNode | null>(null);

    const handleError = (err: any) => {
        if (
            err.name === 'NotAllowedError' ||
            err.name === 'PermissionDeniedError' ||
            err.name === 'NotReadableError' ||
            err.name === 'TrackStartError'
        ) {
            setError(<Translation id="TR_CAMERA_PERMISSION_DENIED" />);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError(<Translation id="TR_CAMERA_NOT_RECOGNIZED" />);
        } else {
            setError(<Translation id="TR_UNKNOWN_ERROR_SEE_CONSOLE" />);
        }
    };

    const { ref } = useZxing({
        onDecodeResult: result => {
            try {
                decision.resolve(result.getText());
                setReaderLoaded(true);
                onCancel();
            } catch (err) {
                handleError(err);
            }
        },
        onError: err => {
            handleError(err);
        },
        timeBetweenDecodingAttempts: 500,
    });

    return (
        <Modal onCancel={onCancel} heading={<Translation id="TR_SCAN_QR_CODE" />}>
            <Column gap={spacings.md}>
                <ContentWrapper>
                    {error && (
                        <Card height="100%">
                            <Column height="100%" justifyContent="center" alignItems="center">
                                <Paragraph intent="critical">
                                    <Translation id="TR_GENERIC_ERROR_TITLE" />
                                </Paragraph>
                                <Paragraph>{error}</Paragraph>
                            </Column>
                        </Card>
                    )}
                    {!readerLoaded && !error && (
                        <Card height="100%">
                            <Column
                                height="100%"
                                justifyContent="center"
                                gap={spacings.xxxl}
                                alignItems="center"
                            >
                                <Icon name="qrCode" size={100} />
                                <Translation id="TR_PLEASE_ALLOW_YOUR_CAMERA" />
                            </Column>
                        </Card>
                    )}
                    {!error && (
                        <ReaderWrapper $isVisible={readerLoaded}>
                            <StyledVideo
                                ref={ref}
                                onLoadedMetadata={() => setReaderLoaded(true)}
                                autoPlay
                                muted
                                playsInline
                            />
                        </ReaderWrapper>
                    )}
                </ContentWrapper>
                <Row gap={spacings.xs} justifyContent="center">
                    <Paragraph intent="neutral" priority="secondary">
                        <Translation id="TR_FOR_EASIER_AND_SAFER_INPUT" />
                    </Paragraph>
                    <LearnMoreButton url={HELP_CENTER_QR_CODE_URL} />
                </Row>
            </Column>
        </Modal>
    );
};
