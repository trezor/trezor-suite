import { type ReactNode, useEffect, useEffectEvent, useRef, useState } from 'react';

import { type QRCamera, QRCanvas, frameLoop, rearCamera } from 'qr/dom.js';
import styled from 'styled-components';

import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Card, Column, Icon, Paragraph, Row } from '@trezor/components';
import { QrCodeIcon } from '@trezor/icons';
import { HELP_CENTER_QR_CODE_URL } from '@trezor/urls';

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
    border-radius: 16px;

    @media (min-width: 768px) {
        transform: scaleX(-1);
    }
`;

type CameraQRReaderProps = {
    onResult: (result: string) => void;
};

export const CameraQRReader = ({ onResult }: CameraQRReaderProps) => {
    const [isReaderLoaded, setIsReaderLoaded] = useState(false);
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

    const videoRef = useRef<HTMLVideoElement>(null);
    const onDecodeResult = useEffectEvent(onResult);
    const onCameraError = useEffectEvent(handleError);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let isActive = true;
        let camera: QRCamera | undefined;
        let cancelFrameLoop: (() => void) | undefined;
        // The default centered square crop discards frame edges, so a QR code outside the middle is missed.
        const qrCanvas = new QRCanvas({}, { cropToSquare: false });

        const stop = () => {
            isActive = false;
            cancelFrameLoop?.();
            camera?.stop();
        };

        rearCamera(video)
            .then(openedCamera => {
                if (!isActive) {
                    openedCamera.stop();

                    return;
                }

                camera = openedCamera;
                cancelFrameLoop = frameLoop(async () => {
                    try {
                        const result = await openedCamera.readFrame(qrCanvas, true);

                        if (isActive && typeof result === 'string') {
                            stop();
                            onDecodeResult(result);
                        }
                    } catch (err) {
                        stop();
                        onCameraError(err);
                    }
                }, video);
            })
            .catch(err => onCameraError(err));

        return stop;
    }, []);

    return (
        <>
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
                {!isReaderLoaded && !error && (
                    <Card height="100%">
                        <Column height="100%" justifyContent="center" gap={40} alignItems="center">
                            <Icon as={QrCodeIcon} size={100} />
                            <Translation id="TR_PLEASE_ALLOW_YOUR_CAMERA" />
                        </Column>
                    </Card>
                )}
                {!error && (
                    <ReaderWrapper $isVisible={isReaderLoaded}>
                        <StyledVideo
                            ref={videoRef}
                            onLoadedMetadata={() => setIsReaderLoaded(true)}
                            autoPlay
                            muted
                            playsInline
                        />
                    </ReaderWrapper>
                )}
            </ContentWrapper>
            <Row gap={8} justifyContent="center">
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_FOR_EASIER_AND_SAFER_INPUT" />
                </Paragraph>
                <LearnMoreButton url={HELP_CENTER_QR_CODE_URL} />
            </Row>
        </>
    );
};
