import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { parseUri } from '@suite-utils/parseUri';
import { H2, P, Icon, colors, variables, Link, Button } from '@trezor/components-v2';
import * as sendFormActions from '@wallet-actions/send/sendFormActions';
import messages from '@suite/support/messages';
import * as URLS from '@suite-constants/urls';
import { Dispatch } from '@suite-types';

const QrReader = dynamic(() => import('react-qr-reader'), { ssr: false });

const Wrapper = styled.div`
    width: 90vw;
    max-width: 450px;
    padding: 30px 0px;
`;

const Padding = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 20px;
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
    background: #ebebeb;
`;

const Error = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0;
`;

const ErrorTitle = styled(P)`
    text-align: center;
    color: ${colors.RED};
`;
const ErrorMessage = styled.span`
    text-align: center;
    color: ${colors.BLACK25};
`;

const Info = styled.div`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
    margin-bottom: 10px;
`;

const IconWrapper = styled.div`
    margin-bottom: 40px;
`;

const StyledLink = styled(Link)`
    font-size: ${variables.FONT_SIZE.TINY};

    &,
    &:active,
    &:hover,
    &:focus {
        font-weight: 500;
    }
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onScan: bindActionCreators(sendFormActions.onQrScan, dispatch),
});

type Props = {
    outputId: number;
    onCancel: () => void;
} & ReturnType<typeof mapDispatchToProps>;

interface State {
    readerLoaded: boolean;
    error: JSX.Element | null;
}

const QrScanner = ({ onScan, onCancel, outputId }: Props) => {
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
            setError(<Translation>{messages.TR_CAMERA_PERMISSION_DENIED}</Translation>);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError(<Translation>{messages.TR_CAMERA_NOT_RECOGNIZED}</Translation>);
        } else {
            setError(<Translation>{messages.TR_UNKOWN_ERROR_SEE_CONSOLE}</Translation>);
        }
    };

    const handleScan = (data: string | null) => {
        if (data) {
            try {
                const parsedUri = parseUri(data);
                if (parsedUri) {
                    onScan(parsedUri, outputId);
                    setReaderLoaded(true);
                    onCancel();
                }
            } catch (error) {
                handleError(error);
            }
        }
    };

    return (
        <Wrapper>
            <Padding>
                <H2>
                    <Translation>{messages.TR_SCAN_QR_CODE}</Translation>
                </H2>
                <Info>
                    <Translation {...messages.TR_FOR_EASIER_AND_SAFER_INPUT} />
                </Info>
                <StyledLink variant="nostyle" href={URLS.WIKI_QR_CODE}>
                    <Button size="small" variant="tertiary">
                        <Translation {...messages.TR_LEARN_MORE} />
                    </Button>
                </StyledLink>
                {!readerLoaded && !error && (
                    <CameraPlaceholderWrapper show>
                        <CameraPlaceholder>
                            <IconWrapper>
                                <Icon icon="QR" size={100} />
                            </IconWrapper>
                            <Translation {...messages.TR_PLEASE_ALLOW_YOUR_CAMERA} />
                        </CameraPlaceholder>
                    </CameraPlaceholderWrapper>
                )}
                {error && (
                    <CameraPlaceholderWrapper show>
                        <CameraPlaceholder>
                            <Error>
                                <ErrorTitle>
                                    <Translation>
                                        {messages.TR_OOPS_SOMETHING_WENT_WRONG}
                                    </Translation>
                                </ErrorTitle>
                                <ErrorMessage>{error}</ErrorMessage>
                            </Error>
                        </CameraPlaceholder>
                    </CameraPlaceholderWrapper>
                )}

                {!error && (
                    <CameraPlaceholderWrapper show={readerLoaded}>
                        <QrReader
                            delay={500}
                            onError={handleError}
                            onScan={handleScan}
                            onLoad={onLoad}
                            style={{ width: '100%', borderRadius: '3px' }}
                            showViewFinder={false}
                        />
                    </CameraPlaceholderWrapper>
                )}

                <Actions>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            // TODO: enable legacyMode and call openImageDialog? https://github.com/JodusNodus/react-qr-reader#readme
                        }}
                    >
                        <Translation {...messages.TR_UPLOAD_IMAGE} />
                    </Button>
                </Actions>
            </Padding>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(QrScanner);
