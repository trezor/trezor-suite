import { lazy, Suspense, useState } from 'react';
import styled from 'styled-components';

import { UserContextPayload } from '@suite-common/suite-types';
import { Icon, Paragraph, NewModalProps, NewModal, Row, Column, Card } from '@trezor/components';
import { borders, spacings } from '@trezor/theme';
import { HELP_CENTER_QR_CODE_URL } from '@trezor/urls';

import { BundleLoader, Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

const QrReader = lazy(() => import(/* webpackChunkName: "react-qr-reader" */ 'react-qr-reader'));

const ContentWrapper = styled.div`
    height: 380px;
`;

const ReaderWrapper = styled.div<{ $isVisible: boolean }>`
    display: ${({ $isVisible }) => !$isVisible && 'none'};
    height: 100%;
`;

const StyledQrReader = styled(QrReader)`
    width: 100%;
    height: 100%;
    position: relative;

    & > section {
        position: initial !important;
        padding-top: initial !important;

        & > video {
            border-radius: ${borders.radii.md};
        }
    }
`;

type QrScannerModalProps = Pick<Extract<UserContextPayload, { type: 'qr-reader' }>, 'decision'> &
    Required<Pick<NewModalProps, 'onCancel'>>;

export const QrScannerModal = ({ decision, onCancel }: QrScannerModalProps) => {
    const [readerLoaded, setReaderLoaded] = useState(false);
    const [error, setError] = useState<JSX.Element | null>(null);

    const onLoad = () => {
        setReaderLoaded(true);
    };

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

    const handleScan = (uri: string | null) => {
        if (uri) {
            try {
                decision.resolve(uri);
                setReaderLoaded(true);
                onCancel();
            } catch (error) {
                handleError(error);
            }
        }
    };

    return (
        <NewModal onCancel={onCancel} heading={<Translation id="TR_SCAN_QR_CODE" />}>
            <Column gap={spacings.md} alignItems="stretch">
                <ContentWrapper>
                    {error && (
                        <Card height="100%">
                            <Column height="100%" justifyContent="center">
                                <Paragraph variant="destructive">
                                    <Translation id="TR_GENERIC_ERROR_TITLE" />
                                </Paragraph>
                                <Paragraph>{error}</Paragraph>
                            </Column>
                        </Card>
                    )}
                    {!readerLoaded && !error && (
                        <Card height="100%">
                            <Column height="100%" justifyContent="center" gap={spacings.xxxl}>
                                <Icon name="qrCode" size={100} />
                                <Translation id="TR_PLEASE_ALLOW_YOUR_CAMERA" />
                            </Column>
                        </Card>
                    )}
                    {!error && (
                        <ReaderWrapper $isVisible={readerLoaded}>
                            <Suspense fallback={<BundleLoader />}>
                                <StyledQrReader
                                    delay={500}
                                    onError={handleError}
                                    onScan={handleScan}
                                    onLoad={onLoad}
                                    showViewFinder={false}
                                />
                            </Suspense>
                        </ReaderWrapper>
                    )}
                </ContentWrapper>
                <Row gap={spacings.xs} justifyContent="center">
                    <Paragraph variant="tertiary">
                        <Translation id="TR_FOR_EASIER_AND_SAFER_INPUT" />
                    </Paragraph>
                    <LearnMoreButton url={HELP_CENTER_QR_CODE_URL} />
                </Row>
            </Column>
        </NewModal>
    );
};
