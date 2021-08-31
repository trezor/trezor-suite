import React, { lazy, Suspense, useState, useReducer } from 'react';
import styled from 'styled-components';

import { ExternalLink, Translation, Modal, BundleLoader } from '@suite-components';
import { DropZone } from '@suite-components/DropZone';
import * as URLS from '@suite-constants/urls';
import { parseUri } from '@suite-utils/parseUri';
import { Icon, colors, P, Switch, variables, Button } from '@trezor/components';
import { UserContextPayload } from '@suite-actions/modalActions';
import { ExtendedMessageDescriptor } from '@suite-types';

const QrReader = lazy(() => import(/* webpackChunkName: "react-qr-reader" */ 'react-qr-reader'));

const Description = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const CameraPlaceholderWrapper = styled.div`
    display: flex;
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
    height: 300px;
    border-radius: 3px;
    background: ${props => props.theme.BG_GREY};
`;

const ErrorWrapper = styled.div`
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

const SwitchWrapper = styled.div`
    display: flex;
    justify-content: left;
    align-items: center;
    & > * {
        margin-right: 10px;
    }
`;

const SwitchLabel = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const QrDropzone = styled(DropZone)`
    width: 100%;
`;

const RefreshButton = styled(Button)`
    margin-top: 10px;
`;

type ErrorId = ExtendedMessageDescriptor['id'];

const getError = (error: { name: string } | ErrorId): ErrorId => {
    if (typeof error === 'string') return error;
    switch (error?.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
        case 'NotReadableError':
        case 'TrackStartError':
            return 'TR_CAMERA_PERMISSION_DENIED';
        case 'NotFoundError':
        case 'DevicesNotFoundError':
            return 'TR_CAMERA_NOT_RECOGNIZED';
        default:
            return 'TR_UNKNOWN_ERROR_SEE_CONSOLE';
    }
};

type QrReaderState =
    | {
          legacy: boolean;
          view: 'dropzone' | 'allow_camera' | 'scanner';
      }
    | {
          legacy: boolean;
          view: 'error';
          error: ErrorId;
      };

type QrReaderAction =
    | {
          type: 'legacy_changed';
          legacy: boolean;
      }
    | {
          type: 'error_encountered';
          error: { name: string } | ErrorId;
      }
    | {
          type: 'reset' | 'scanner_loaded';
      };

const getInitialState = (legacy: boolean): QrReaderState => ({
    legacy,
    view: legacy ? 'dropzone' : 'allow_camera',
});

const qrReaderReducer = (state: QrReaderState, action: QrReaderAction): QrReaderState => {
    const { legacy, view } = state;
    switch (action.type) {
        case 'reset':
            return getInitialState(legacy);
        case 'error_encountered':
            return { legacy, view: 'error', error: getError(action.error) };
        case 'legacy_changed':
            return action.legacy === legacy ? state : getInitialState(action.legacy);
        case 'scanner_loaded':
            return legacy || view === 'scanner'
                ? state
                : {
                      legacy,
                      view: 'scanner',
                  };
        default:
            throw new Error('Unrecognized action');
    }
};

type Props = {
    onCancel: () => void;
    decision: Extract<UserContextPayload, { type: 'qr-reader' }>['decision'];
    // Whether the components should start in upload mode (otherwise it starts in scanner mode)
    uploadFirst?: boolean;
};

const QrScanner = ({ onCancel, decision, uploadFirst = false }: Props) => {
    const [qrReader, setQrReader] = useState<QrReader | null>(null);
    const [state, dispatch] = useReducer(qrReaderReducer, getInitialState(uploadFirst));

    const handleScan = (data: string | null) => {
        if (data) {
            try {
                const parsedUri = parseUri(data);
                if (parsedUri) {
                    decision.resolve(parsedUri);
                    onCancel();
                }
            } catch (error) {
                dispatch({ type: 'error_encountered', error });
            }
        } else if (state.legacy) {
            dispatch({ type: 'error_encountered', error: 'TR_QR_CODE_MISSING' });
        }
    };

    const handleUpload = (data: File) => {
        qrReader?.handleInputChange({
            target: {
                files: [data],
            },
        });
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
            <CameraPlaceholderWrapper>
                {(() => {
                    switch (state.view) {
                        case 'dropzone':
                            return (
                                <QrDropzone accept="image/*" icon="QR" onSelect={handleUpload} />
                            );
                        case 'allow_camera':
                            return (
                                <CameraPlaceholder>
                                    <IconWrapper>
                                        <Icon icon="QR" size={100} />
                                    </IconWrapper>
                                    <Translation id="TR_PLEASE_ALLOW_YOUR_CAMERA" />
                                </CameraPlaceholder>
                            );
                        case 'error':
                            return (
                                <CameraPlaceholder>
                                    <ErrorWrapper>
                                        <ErrorTitle>
                                            <Translation id="TR_GENERIC_ERROR_TITLE" />
                                        </ErrorTitle>
                                        <ErrorMessage>
                                            <Translation id={state.error} />
                                        </ErrorMessage>
                                        <RefreshButton
                                            variant="tertiary"
                                            icon="REFRESH"
                                            onClick={() => dispatch({ type: 'reset' })}
                                        >
                                            <Translation id="TR_TRY_AGAIN" />
                                        </RefreshButton>
                                    </ErrorWrapper>
                                </CameraPlaceholder>
                            );
                        case 'scanner':
                        default:
                            return null;
                    }
                })()}
                <Suspense fallback={<BundleLoader />}>
                    <div
                        style={{
                            width: '100%',
                            display: state.view === 'scanner' ? 'initial' : 'none',
                        }}
                    >
                        <QrReader
                            delay={500}
                            onError={error => dispatch({ type: 'error_encountered', error })}
                            onScan={handleScan}
                            onLoad={() => dispatch({ type: 'scanner_loaded' })}
                            showViewFinder={false}
                            ref={setQrReader}
                            legacyMode={state.legacy}
                            style={{
                                width: '100%',
                                borderRadius: '3px',
                            }}
                        />
                    </div>
                </Suspense>
            </CameraPlaceholderWrapper>
            <SwitchWrapper>
                <SwitchLabel>Upload QR</SwitchLabel>
                <Switch
                    checked={!state.legacy}
                    onChange={e => dispatch({ type: 'legacy_changed', legacy: !e })}
                />
                <SwitchLabel>Scan QR</SwitchLabel>
            </SwitchWrapper>
        </Modal>
    );
};

export default QrScanner;
