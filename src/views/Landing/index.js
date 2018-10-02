/* @flow */
import React from 'react';
import CaseImage from 'images/case.png';
import styled from 'styled-components';
import Header from 'components/Header';
import Footer from 'components/Footer';
import Log from 'components/Log';
import Link from 'components/Link';
import Loader from 'components/Loader';
import Notifications, { Notification } from 'components/Notification';
import colors from 'config/colors';
import P from 'components/Paragraph';
import { H2 } from 'components/Heading';
import { isWebUSB } from 'utils/device';
import { FONT_SIZE } from 'config/variables';

import InitializationError from './components/InitializationError';
import BrowserNotSupported from './components/BrowserNotSupported';
import ConnectDevice from './components/ConnectDevice';
import InstallBridge from './components/InstallBridge';

import type { Props } from './Container';

const LandingWrapper = styled.div`
    min-height: 100%;
    min-width: 720px;

    display: flex;
    flex-direction: column;
    align-items: center;

    text-align: center;
    background: ${colors.LANDING};
`;

const LandingContent = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const LandingImage = styled.img`
    width: 777px;
    min-height: 500px;
    margin: auto;
    background-repeat: no-repeat;
    background-position: center 0px;
    background-size: contain;
`;

const TitleWrapper = styled.div`
    margin-top: 60px;
`;

const LandingFooterWrapper = styled.div`
    margin-bottom: 32px;
`;

const LandingFooterTextWrapper = styled.span`
    margin-right: 4px;
`;

const LandingLoader = styled(Loader)`
    margin: auto;
`;

const StyledLink = styled(Link)`
    font-size: ${FONT_SIZE.BASE};
`;

export default (props: Props) => {
    const { devices } = props;
    const { browserState, transport } = props.connect;
    const localStorageError = props.localStorage.error;
    const connectError = props.connect.error;

    const bridgeRoute: boolean = props.router.location.state.hasOwnProperty('bridge');
    const deviceLabel = props.wallet.disconnectRequest ? props.wallet.disconnectRequest.label : '';

    const shouldShowInitializationError = connectError && !props.connect.initialized;
    const shouldShowInstallBridge = props.connect.initialized && (connectError || bridgeRoute);
    const shouldShowConnectDevice = props.wallet.ready && devices.length < 1;
    const shouldShowDisconnectDevice = !!props.wallet.disconnectRequest;
    const shouldShowUnsupportedBrowser = browserState.supported === false;

    const isLoading = !shouldShowInitializationError && !shouldShowInstallBridge && !shouldShowConnectDevice && !shouldShowUnsupportedBrowser && !localStorageError;
    return (
        <LandingWrapper>
            {isLoading && <LandingLoader text="Loading" size={100} />}
            {!isLoading && (
                <React.Fragment>
                    <Header />
                    {localStorageError && (
                        <Notification
                            title="Initialization error"
                            message="Config files are missing"
                            type="error"
                        />
                    )}
                    <Notifications />
                    {shouldShowInitializationError && <InitializationError error={connectError} />}
                    <Log />
                    <LandingContent>
                        {shouldShowUnsupportedBrowser && <BrowserNotSupported />}
                        {shouldShowInstallBridge && <InstallBridge browserState={browserState} />}

                        {(shouldShowConnectDevice || shouldShowDisconnectDevice) && (
                            <div>
                                <TitleWrapper>
                                    <H2 claim>The private bank in your hands.</H2>
                                    <P>TREZOR Wallet is an easy-to-use interface for your TREZOR.</P>
                                    <P>TREZOR Wallet allows you to easily control your funds, manage your balance and initiate transfers.</P>
                                </TitleWrapper>

                                <ConnectDevice
                                    deviceLabel={deviceLabel}
                                    showWebUsb={isWebUSB(transport)}
                                    showDisconnect={shouldShowDisconnectDevice}
                                />

                                <LandingImage src={CaseImage} />

                                {shouldShowConnectDevice && (
                                    <LandingFooterWrapper>
                                        {isWebUSB(transport) && (
                                            <P>
                                                <LandingFooterTextWrapper>
                                                    Device not recognized?
                                                </LandingFooterTextWrapper>
                                                <StyledLink
                                                    href="#/bridge"
                                                    isGreen
                                                >Try installing the TREZOR Bridge.
                                                </StyledLink>
                                            </P>
                                        )}
                                        <P>
                                            <LandingFooterTextWrapper>
                                                Don&amp;t have TREZOR?
                                            </LandingFooterTextWrapper>
                                            <StyledLink
                                                href="https://trezor.io/"
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                isGreen
                                            >Get one
                                            </StyledLink>
                                        </P>
                                    </LandingFooterWrapper>
                                )}
                            </div>
                        )}
                    </LandingContent>

                    <Footer />
                </React.Fragment>
            )}
        </LandingWrapper>
    );
};
