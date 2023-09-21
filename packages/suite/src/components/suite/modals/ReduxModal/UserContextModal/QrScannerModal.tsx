import { lazy, Suspense, useState } from 'react';

import styled from 'styled-components';

import { HELP_CENTER_QR_CODE_URL } from '@trezor/urls';
import { Icon, colors, P, Button, Textarea, SelectBar } from '@trezor/components';
import { UserContextPayload } from '@suite-common/suite-types';

import { TrezorLink, Translation, Modal, BundleLoader } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';

const QrReader = lazy(() => import(/* webpackChunkName: "react-qr-reader" */ 'react-qr-reader'));

const DescriptionWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 16px 16px 0;
`;

const Description = styled.div`
    text-align: left;
    margin-left: 16px;
    & * + * {
        margin-left: 8px;
    }
`;

const ContentWrapper = styled.div<{ show: boolean }>`
    display: ${props => (props.show ? 'flex' : 'none')};
    flex-direction: column;
    margin: 16px;
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
    height: 100%;
    border-radius: 16px;
    background: ${({ theme }) => theme.BG_GREY};
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
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const IconWrapper = styled.div`
    margin-bottom: 40px;
`;

const ActionButton = styled(Button)`
    min-width: 200px;
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

const StyledTextarea = styled(Textarea)`
    height: 100%;
    & > textarea {
        flex: 1;
    }
`;

const StyledModal = styled(Modal)`
    ${Modal.Body} {
        padding: 0;
    }
`;

interface QrScannerModalProps
    extends Omit<Extract<UserContextPayload, { type: 'qr-reader' }>, 'type'> {
    onCancel: () => void;
}

export interface State {
    readerLoaded: boolean;
    error: JSX.Element | null;
}

export const QrScannerModal = ({ onCancel, decision, allowPaste }: QrScannerModalProps) => {
    const [readerLoaded, setReaderLoaded] = useState<State['readerLoaded']>(false);
    const [error, setError] = useState<State['error']>(null);
    const [isPasteMode, setPasteMode] = useState(false);
    const [text, setText] = useState('');

    const { translationString } = useTranslation();

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
        <StyledModal
            isCancelable
            onCancel={onCancel}
            heading={<Translation id={isPasteMode ? 'TR_PASTE_URI' : 'TR_SCAN_QR_CODE'} />}
            description={
                <DescriptionWrapper>
                    {allowPaste && (
                        <SelectBar
                            options={[
                                { label: <Translation id="TR_PASTE_URI" />, value: 'paste' },
                                { label: <Translation id="TR_QR_CODE" />, value: 'scan' },
                            ]}
                            selectedOption={isPasteMode ? 'paste' : 'scan'}
                            onChange={value => setPasteMode(value === 'paste')}
                        />
                    )}
                    {!isPasteMode && (
                        <Description>
                            <Translation id="TR_FOR_EASIER_AND_SAFER_INPUT" />
                            <TrezorLink
                                icon="EXTERNAL_LINK"
                                size="small"
                                href={HELP_CENTER_QR_CODE_URL}
                            >
                                <Translation id="TR_LEARN_MORE" />
                            </TrezorLink>
                        </Description>
                    )}
                </DescriptionWrapper>
            }
            bottomBarComponents={
                isPasteMode ? (
                    <ActionButton isDisabled={!text} onClick={() => handleScan(text)}>
                        <Translation id="TR_CONFIRM" />
                    </ActionButton>
                ) : null
            }
        >
            {isPasteMode && (
                <ContentWrapper show>
                    <StyledTextarea
                        placeholder={`${translationString('TR_PASTE_URI')}…`}
                        onChange={e => {
                            setText(e.target.value);
                        }}
                    />
                </ContentWrapper>
            )}

            {!isPasteMode && !readerLoaded && !error && (
                <ContentWrapper show>
                    <CameraPlaceholder>
                        <IconWrapper>
                            <Icon icon="QR" size={100} />
                        </IconWrapper>
                        <Translation id="TR_PLEASE_ALLOW_YOUR_CAMERA" />
                    </CameraPlaceholder>
                </ContentWrapper>
            )}
            {!isPasteMode && error && (
                <ContentWrapper show>
                    <CameraPlaceholder>
                        <Error>
                            <ErrorTitle>
                                <Translation id="TR_GENERIC_ERROR_TITLE" />
                            </ErrorTitle>
                            <ErrorMessage>{error}</ErrorMessage>
                        </Error>
                    </CameraPlaceholder>
                </ContentWrapper>
            )}

            {!isPasteMode && !error && (
                <ContentWrapper show={readerLoaded}>
                    <Suspense fallback={<BundleLoader />}>
                        <StyledQrReader
                            delay={500}
                            onError={handleError}
                            onScan={handleScan}
                            onLoad={onLoad}
                            showViewFinder={false}
                        />
                    </Suspense>
                </ContentWrapper>
            )}
        </StyledModal>
    );
};
