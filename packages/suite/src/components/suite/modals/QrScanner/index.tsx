import React, { lazy, Suspense, useState } from 'react';
import styled from 'styled-components';

import { TrezorLink, Translation, Modal, BundleLoader } from '@suite-components';
import * as URLS from '@suite-constants/urls';
import { Icon, colors, P, Button, Textarea, SelectBar } from '@trezor/components';
import { UserContextPayload } from '@suite-actions/modalActions';
import { useTranslation } from '@suite-hooks';

const QrReader = lazy(() => import(/* webpackChunkName: "react-qr-reader" */ 'react-qr-reader'));

const DescriptionWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 16px;
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
    margin: 12px 0;
    justify-content: center;
    & > * {
        min-width: 200px;
    }
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

type Props = Omit<Extract<UserContextPayload, { type: 'qr-reader' }>, 'type'> & {
    onCancel: () => void;
};

export interface State {
    readerLoaded: boolean;
    error: JSX.Element | null;
}

const QrScanner = ({ onCancel, decision, allowPaste }: Props) => {
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
        <Modal
            noPadding
            cancelable
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
                            <TrezorLink icon="EXTERNAL_LINK" size="small" href={URLS.WIKI_QR_CODE}>
                                <Translation id="TR_LEARN_MORE" />
                            </TrezorLink>
                        </Description>
                    )}
                </DescriptionWrapper>
            }
        >
            {isPasteMode && (
                <ContentWrapper show>
                    <StyledTextarea
                        noTopLabel
                        placeholder={`${translationString('TR_PASTE_URI')}…`}
                        onChange={e => {
                            setText(e.target.value);
                        }}
                    />
                    <Actions>
                        <Button isDisabled={!text} onClick={() => handleScan(text)}>
                            <Translation id="TR_CONFIRM" />
                        </Button>
                    </Actions>
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
        </Modal>
    );
};

export default QrScanner;
