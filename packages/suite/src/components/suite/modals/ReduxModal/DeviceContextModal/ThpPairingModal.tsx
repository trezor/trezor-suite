import { lazy, Suspense, useState, useRef, ChangeEvent } from 'react';
import styled from 'styled-components';

import { variables, Button, Input, Icon, IconButton, Paragraph } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { isAndroid } from '@trezor/env-utils';

// import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import { Translation, BundleLoader, Modal } from 'src/components/suite';
import type { TrezorDevice } from 'src/types/suite';

const QrReader = lazy(() => import(/* webpackChunkName: "react-qr-reader" */ 'react-qr-reader'));

const StyledModal = styled(Modal)`
    width: 460px;
`;

const StyledButton = styled(Button)`
    margin: 8px 0;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const ContentWrapper = styled.div`
    flex-direction: column;
    overflow: hidden;
    height: 380px;
`;

const CameraPlaceholder = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    flex: 1;
    padding: 40px;
    height: 240px;
    border-radius: 16px;
    background: ${({ theme }) => theme.BG_GREY};
`;

const Error = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0;
`;

const ErrorTitle = styled(Paragraph)`
    text-align: center;
`;

const ErrorMessage = styled.span`
    text-align: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const IconWrapper = styled.div`
    margin-bottom: 40px;
`;

const StyledQrReader = styled(QrReader)`
    width: 100%;
    height: 100%;
    position: relative;

    & > section {
        position: initial !important;
        padding-top: initial !important;

        & > video {
            border-radius: 16px;
        }
    }
`;

const InputWrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 24px;
`;

const CameraWrapper = styled.div`
    position: relative;
    height: 240px;
`;

const StyledIconButton = styled(IconButton)`
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 1;
`;

interface ThpPairingModalModalProps {
    device: TrezorDevice;
}

/**
 * Modal used with T2T1 with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {ThpPairingModalModalProps}
 */
export const ThpPairingModal = (_: ThpPairingModalModalProps) => {
    const [isLoading, setLoading] = useState(false);
    const [mode, setMode] = useState<'qr-code' | 'code-entry' | 'loading'>('code-entry');
    const [codeEntry, setCodeEntry] = useState('');
    const codeEntryInputRef = useRef<HTMLInputElement>(null);

    const onQrCode = (value: string) => {
        setLoading(true);
        setMode('loading');
        TrezorConnect.uiResponse({
            type: 'ui-receive_thp_pairing_tag',
            payload: {
                source: 'qr-code',
                value,
            },
        });
    };
    const onPinCode = (value: string) => {
        setLoading(true);
        TrezorConnect.uiResponse({
            type: 'ui-receive_thp_pairing_tag',
            payload: {
                source: 'code-entry',
                value,
            },
        });
    };

    const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const pairingCode = e.target.value;
        setCodeEntry(pairingCode);
        if (pairingCode.length >= 6) {
            onPinCode(pairingCode);
        }
    };

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
        console.warn('handleScan', uri);
        if (uri) {
            onQrCode(uri);
        }
    };

    // useEffect(() => {
    //     navigator.mediaDevices
    //         .getUserMedia({ video: true })
    //         .then(() => {
    //             console.warn('CAMERA ALLOWED!');
    //         })
    //         .catch(_e => {
    //             console.warn('CameraError', _e);
    //         });
    // }, []);

    // console.warn('camera?', navigator.mediaDevices.getUserMedia({ video: true }));

    return (
        <StyledModal heading="Pairing with Trezor" data-test="@modal/thp-paring">
            {['code-entry', 'qr-code'].includes(mode) && (
                <ContentWrapper>
                    <InputWrapper>
                        <Input
                            placeholder="Rewrite pin code from Trezor"
                            innerRef={codeEntryInputRef}
                            onChange={onInputChange}
                            hasBottomPadding={false}
                            autoFocus={!isAndroid()}
                        />
                        <StyledButton
                            onClick={() => onPinCode(codeEntry)}
                            isLoading={isLoading}
                            isDisabled={isLoading}
                        >
                            Send code
                        </StyledButton>
                    </InputWrapper>

                    {mode === 'code-entry' && (
                        <CameraPlaceholder>
                            <IconWrapper>
                                <Icon name="qrCode" size={100} />
                            </IconWrapper>
                            <StyledButton
                                variant="tertiary"
                                onClick={() => setMode('qr-code')}
                                // onClick={() => setMode('loading')}
                                isLoading={isLoading}
                                isDisabled={isLoading}
                            >
                                <Translation id="TR_PLEASE_ALLOW_YOUR_CAMERA" />
                            </StyledButton>
                        </CameraPlaceholder>
                    )}

                    {mode === 'qr-code' && (
                        <Suspense fallback={<BundleLoader />}>
                            <CameraWrapper>
                                <StyledIconButton
                                    variant="tertiary"
                                    icon="cross"
                                    onClick={() => setMode('code-entry')}
                                    size="small"
                                />
                                <StyledQrReader
                                    delay={500}
                                    onError={handleError}
                                    onScan={handleScan}
                                    onLoad={onLoad}
                                    showViewFinder={false}
                                />
                            </CameraWrapper>
                        </Suspense>
                    )}
                    {mode === 'qr-code' && !readerLoaded && !error && (
                        <CameraPlaceholder>
                            <IconWrapper>
                                <Icon name="qrCode" size={100} />
                            </IconWrapper>
                            <Translation id="TR_PLEASE_ALLOW_YOUR_CAMERA" />
                        </CameraPlaceholder>
                    )}

                    {mode === 'qr-code' && error && (
                        <CameraPlaceholder>
                            <Error>
                                <ErrorTitle>
                                    <Translation id="TR_GENERIC_ERROR_TITLE" />
                                </ErrorTitle>
                                <ErrorMessage>{error}</ErrorMessage>
                            </Error>
                        </CameraPlaceholder>
                    )}
                </ContentWrapper>
            )}

            {mode === 'loading' && (
                <ContentWrapper>
                    <CameraPlaceholder>
                        <BundleLoader />
                    </CameraPlaceholder>
                </ContentWrapper>
            )}
        </StyledModal>
    );
};
