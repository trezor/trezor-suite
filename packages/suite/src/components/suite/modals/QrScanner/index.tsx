import React, { lazy, Suspense, useState } from 'react';
import styled from 'styled-components';

import { ExternalLink, Translation, Modal } from '@suite-components';
import * as URLS from '@suite-constants/urls';
import { parseUri } from '@suite-utils/parseUri';
import { Icon, colors, P, Loader } from '@trezor/components';
import { UserContextPayload } from '@suite-actions/modalActions';

const QrReader = lazy(() => import(/* webpackChunkName: "react-qr-reader" */ 'react-qr-reader'));

const Description = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const CameraPlaceholderWrapper = styled.div<{ show: boolean }>`
    display: ${props => (props.show ? 'flex' : 'none')};
    margin: 12px 0px 20px 0px;
    width: 100%;
`;

const CameraPlaceholder = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    flex: 1;
    padding: 40px;
    height: 320px;
    border-radius: 3px;
    background: ${props => props.theme.BG_GREY};
`;

const Error = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0;
`;

const ErrorTitle = styled(P)`
    text-align: center;
    color: ${colors.TYPE_RED};
`;
const ErrorMessage = styled.span`
    text-align: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const IconWrapper = styled.div`
    margin-bottom: 40px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
`;

type Props = {
    onCancel: () => void;
    decision: Extract<UserContextPayload, { type: 'qr-reader' }>['decision'];
};

interface State {
    readerLoaded: boolean;
    error: JSX.Element | null;
}

const QrScanner = ({ onCancel, decision }: Props) => {
    const [readerLoaded, setReaderLoaded] = useState<State['readerLoaded']>(false);
    const [error, setError] = useState<State['error']>(null);

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

    const handleScan = (data: string | null) => {
        if (data) {
            try {
                const parsedUri = parseUri(data);
                if (parsedUri) {
                    decision.resolve(parsedUri);
                    setReaderLoaded(true);
                    onCancel();
                }
            } catch (error) {
                handleError(error);
            }
        }
    };

    return (
        <Modal
            cancelable
            onCancel={onCancel}
            heading={<Translation id="TR_SCAN_QR_CODE" />}
            description={
                <Description>
                    <Translation id="TR_FOR_EASIER_AND_SAFER_INPUT" />
                    <ExternalLink size="small" href={URLS.WIKI_QR_CODE}>
                        <Translation id="TR_LEARN_MORE" />
                    </ExternalLink>
                </Description>
            }
        >
            {!readerLoaded && !error && (
                <CameraPlaceholderWrapper show>
                    <CameraPlaceholder>
                        <IconWrapper>
                            <Icon icon="QR" size={100} />
                        </IconWrapper>
                        <Translation id="TR_PLEASE_ALLOW_YOUR_CAMERA" />
                    </CameraPlaceholder>
                </CameraPlaceholderWrapper>
            )}
            {error && (
                <CameraPlaceholderWrapper show>
                    <CameraPlaceholder>
                        <Error>
                            <ErrorTitle>
                                <Translation id="TR_GENERIC_ERROR_TITLE" />
                            </ErrorTitle>
                            <ErrorMessage>{error}</ErrorMessage>
                        </Error>
                    </CameraPlaceholder>
                </CameraPlaceholderWrapper>
            )}

            {!error && (
                <CameraPlaceholderWrapper show={readerLoaded}>
                    <Suspense fallback={<Loader size={64} />}>
                        <QrReader
                            delay={500}
                            onError={handleError}
                            onScan={handleScan}
                            onLoad={onLoad}
                            style={{ width: '100%', borderRadius: '3px' }}
                            showViewFinder={false}
                        />
                    </Suspense>
                </CameraPlaceholderWrapper>
            )}

            <Actions>
                {/* <Button
                        variant="secondary"
                        onClick={() => {
                            // TODO: enable legacyMode and call openImageDialog? https://github.com/JodusNodus/react-qr-reader#readme
                        }}
                    >
                        <Translation id="TR_UPLOAD_IMAGE" />
                    </Button> */}
            </Actions>
        </Modal>
    );
};

export default QrScanner;
