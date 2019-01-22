/* @flow */

import * as React from 'react';
import PropTypes from 'prop-types';
import QrReader from 'react-qr-reader';
import styled from 'styled-components';

import colors from 'config/colors';
import icons from 'config/icons';

import { H2 } from 'components/Heading';
import P from 'components/Paragraph';
import Icon from 'components/Icon';
import Link from 'components/Link';

import { parseUri } from 'utils/cryptoUriParser';
import type { parsedURI } from 'utils/cryptoUriParser';
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

const Error = styled(P)`
    text-align: center;
    padding: 10px 0;
    color: ${colors.ERROR_PRIMARY};
`;

const StyledQrReader = styled(QrReader)`
    padding: 10px 0;
`;

// TODO fix types
type Props = {
    onScan: (data: parsedURI) => any,
    onError?: (error: any) => any,
    onCancel?: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onCancel'>;
}

type State = {
    readerLoaded: boolean,
    error: any,
};

class QrModal extends React.Component<Props, State> {
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
        console.log(err);
        this.setState({
            error: err,
        });

        if (this.props.onError) {
            this.props.onError(err);
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
                    <H2>Scan an address from a QR code</H2>
                    {!this.state.readerLoaded && (
                        <CameraPlaceholder>
                            Waiting for camera...
                        </CameraPlaceholder>)
                    }
                </Padding>
                <StyledQrReader
                    delay={500}
                    onError={this.handleError}
                    onScan={this.handleScan}
                    onLoad={this.onLoad}
                    style={{ width: '100%' }}
                    showViewFinder={false}
                />
                <Padding>
                    {this.state.error && (
                        <Error>
                            {this.state.error.toString()}
                        </Error>
                    )}
                </Padding>
            </Wrapper>
        );
    }
}

QrModal.propTypes = {
    onScan: PropTypes.func.isRequired,
    onError: PropTypes.func,
    onCancel: PropTypes.func,
};

export default QrModal;
