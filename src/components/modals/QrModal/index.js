/* @flow */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import QrReader from 'react-qr-reader';
import styled from 'styled-components';
import { FormattedMessage, injectIntl } from 'react-intl';

import colors from 'config/colors';
import icons from 'config/icons';

import { H2 } from 'components/Heading';
import P from 'components/Paragraph';
import Icon from 'components/Icon';
import Link from 'components/Link';

import { parseUri } from 'utils/cryptoUriParser';
import type { parsedURI } from 'utils/cryptoUriParser';
import l10nMessages from './index.messages';
import type { Props as BaseProps } from '../Container';

const Wrapper = styled.div`
    width: 90vw;
    max-width: 450px;
    padding: 30px 0px;
`;

const Padding = styled.div`
    padding: 0px 48px;
`;

const CloseLink = styled(Link)`
    position: absolute;
    right: 15px;
    top: 15px;
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

const StyledQrReader = styled(QrReader)`
    padding: 10px 0;
`;

// TODO fix types
type Props = {
    onScan: (data: parsedURI) => any,
    onError?: (error: any) => any,
    onCancel?: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onCancel'>,
    intl: any,
}

type State = {
    readerLoaded: boolean,
    error: any,
};

class QrModal extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            readerLoaded: false,
            error: null,
        };
    }

    onLoad = () => {
        this.setState({
            readerLoaded: true,
        });
    }

    handleScan = (data: string) => {
        if (data) {
            try {
                const parsedUri = parseUri(data);
                if (parsedUri) {
                    this.props.onScan(parsedUri);
                    // reset error
                    this.setState({
                        error: null,
                    });
                    // close window
                    this.handleCancel();
                }
            } catch (error) {
                this.handleError(error);
            }
        }
    }

    handleError = (err: any) => {
        // log thrown error
        console.error(err);
        if (this.props.onError) {
            this.props.onError(err);
        }

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            || err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            this.setState({
                error: this.props.intl.formatMessage(l10nMessages.TR_CAMERA_PERMISSION_DENIED),
            });
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            this.setState({
                error: this.props.intl.formatMessage(l10nMessages.TR_CAMERA_NOT_RECOGNIZED),
            });
        } else {
            this.setState({
                error: this.props.intl.formatMessage(l10nMessages.TR_UNKOWN_ERROR_SEE_CONSOLE),
            });
        }
    }

    handleCancel = () => {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }


    render() {
        return (
            <Wrapper>
                <CloseLink onClick={this.handleCancel}>
                    <Icon
                        size={24}
                        color={colors.TEXT_SECONDARY}
                        icon={icons.CLOSE}
                    />
                </CloseLink>
                <Padding>
                    <H2><FormattedMessage {...l10nMessages.TR_SCAN_QR_CODE} /></H2>
                    {!this.state.readerLoaded && !this.state.error && <CameraPlaceholder><FormattedMessage {...l10nMessages.TR_WAITING_FOR_CAMERA} /></CameraPlaceholder>}
                    {this.state.error && (
                        <Error>
                            <ErrorTitle><FormattedMessage {...l10nMessages.TR_OOPS_SOMETHING_WENT_WRONG} /></ErrorTitle>
                            <ErrorMessage>{this.state.error.toString()}</ErrorMessage>
                        </Error>
                    )}
                </Padding>
                {!this.state.error && (
                    <StyledQrReader
                        delay={500}
                        onError={this.handleError}
                        onScan={this.handleScan}
                        onLoad={this.onLoad}
                        style={{ width: '100%' }}
                        showViewFinder={false}
                    />
                )}
            </Wrapper>
        );
    }
}

QrModal.propTypes = {
    onScan: PropTypes.func.isRequired,
    onError: PropTypes.func,
    onCancel: PropTypes.func,
    intl: PropTypes.any,
};

export default injectIntl(QrModal);
