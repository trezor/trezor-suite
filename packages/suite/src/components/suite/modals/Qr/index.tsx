import React, { FunctionComponent, useState } from 'react';
import dynamic from 'next/dynamic';

import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { H5, P, colors } from '@trezor/components';

import { parseUri, ParsedURI } from '@suite-utils/parseUri';
import l10nMessages from './messages';

const QrReader = dynamic(() => import('react-qr-reader'), { ssr: false });

const Wrapper = styled.div`
    width: 90vw;
    max-width: 450px;
    padding: 30px 0px;
`;

const Padding = styled.div`
    padding: 0px 48px;
`;

const CameraPlaceholder = styled(P)`
    text-align: center;
    padding: 10px 0;
`;

const Error = styled.div`
    padding: 10px 0;
`;

const ErrorTitle = styled(P)`
    text-align: center;
    color: ${colors.ERROR_PRIMARY};
`;
const ErrorMessage = styled.span`
    text-align: center;
    color: ${colors.TEXT_PRIMARY};
`;

// TODO fix types
interface Props {
    onScan: (data: ParsedURI) => void;
    onError?: (error: any) => any;
    onCancel?: () => void;
}

interface State {
    readerLoaded: boolean;
    error: any;
}

const QrModal: FunctionComponent<Props> = ({ onScan, onError, onCancel }) => {
    const [readerLoaded, setReaderLoaded] = useState<State['readerLoaded']>(false);
    const [error, setError] = useState<State['error']>(null);

    const onLoad = () => {
        setReaderLoaded(true);
    };

    const handleError = (err: any) => {
        // log thrown error
        console.error(err);
        if (onError) {
            onError(err);
        }

        if (
            err.name === 'NotAllowedError' ||
            err.name === 'PermissionDeniedError' ||
            err.name === 'NotReadableError' ||
            err.name === 'TrackStartError'
        ) {
            setError(<FormattedMessage {...l10nMessages.TR_CAMERA_PERMISSION_DENIED} />);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError(<FormattedMessage {...l10nMessages.TR_CAMERA_NOT_RECOGNIZED} />);
        } else {
            setError(<FormattedMessage {...l10nMessages.TR_UNKOWN_ERROR_SEE_CONSOLE} />);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
    };

    const handleScan = (data: string | null) => {
        if (data) {
            try {
                const parsedUri = parseUri(data);
                if (parsedUri) {
                    onScan(parsedUri);
                    setReaderLoaded(true);
                    handleCancel();
                }
            } catch (error) {
                handleError(error);
            }
        }
    };

    return (
        <Wrapper>
            <Padding>
                <H5>
                    <FormattedMessage {...l10nMessages.TR_SCAN_QR_CODE} />
                </H5>
                {!readerLoaded && !error && (
                    <CameraPlaceholder>
                        <FormattedMessage {...l10nMessages.TR_WAITING_FOR_CAMERA} />
                    </CameraPlaceholder>
                )}
                {error && (
                    <Error>
                        <ErrorTitle>
                            <FormattedMessage {...l10nMessages.TR_OOPS_SOMETHING_WENT_WRONG} />
                        </ErrorTitle>
                        <ErrorMessage>{error.toString()}</ErrorMessage>
                    </Error>
                )}
            </Padding>
            {!error && (
                <QrReader
                    delay={500}
                    onError={handleError}
                    onScan={handleScan}
                    onLoad={onLoad}
                    style={{ width: '100%' }}
                    showViewFinder={false}
                />
            )}
        </Wrapper>
    );
};

export default QrModal;
