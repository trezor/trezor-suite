/* @flow */

import React, { PureComponent } from 'react';
import styled, { keyframes } from 'styled-components';
import TrezorConnect from 'trezor-connect';
import P from 'components/Paragraph';
import Button from 'components/Button';
import { H2 } from 'components/Heading';
import { PULSATE } from 'config/animations';
import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT, SCREEN_SIZE } from 'config/variables';
import CaseImage from 'images/macbook.png';
import Link from 'components/Link';

type Props = {
    deviceLabel: string,
    showWebUsb: boolean,
    showDisconnect: boolean,
};

const StyledConnectDevice = styled.div`
    padding: 0px 48px;
`;

const Title = styled.div`
    margin-top: 60px;
`;

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    margin: 0 auto;
    padding: 36px 0;
    justify-content: center;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        align-content: center;
        flex-direction: column;
    }
`;

const ConnectTrezorWrapper = styled.div`
    position: relative;
    top: 1px;
    margin: 15px 15px 0px 15px;
    animation: ${PULSATE} 1.3s ease-out infinite;
    color: ${colors.GREEN_PRIMARY};
    font-size: ${FONT_SIZE.BIG};
    font-weight: ${FONT_WEIGHT.MEDIUM};
`;

const StyledP = styled(P)`
    line-height: auto;
    margin: 15px 15px 0px 15px;
`;

const StyledButton = styled(Button)`
    margin: 15px 15px 5px 15px;
`;

const Image = styled.img`
    width: 100%;
    max-width: 777px;
    height: auto;
    margin: auto;
    background-repeat: no-repeat;
    background-position: center 0px;
    background-size: contain;
`;

const Footer = styled.div`
    margin-bottom: 32px;
`;

const FooterText = styled.span`
    margin-right: 4px;
`;

const StyledLink = styled(Link)`
    font-size: ${FONT_SIZE.BIG};
`;

class ConnectDevice extends PureComponent<Props> {
    componentDidMount() {
        if (this.props.showWebUsb) {
            TrezorConnect.renderWebUSBButton();
        }
    }

    componentDidUpdate() {
        if (this.props.showWebUsb) {
            TrezorConnect.renderWebUSBButton();
        }
    }

    getTrezorDeviceImage() {
        const animationConnect = keyframes`
            0%, 100% {
                transform: translateY(0px);
            }
            50% {
                transform: translateY(-4px)
            }
        `;
        const ImageWrapper = styled.svg`
            position: absolute;
            top: -8px;
            left: -24px;
        `;
        const DeviceRect = styled.rect`
            animation: ${animationConnect} 1.3s ease-out infinite;
        `;
        return (
            <ImageWrapper width="12px" height="35px" viewBox="0 0 20 57">
                <g stroke="none" strokeWidth="1" fill="none" transform="translate(1, 1)">
                    <DeviceRect fill="#01B757" x="6" y="39" width="6" height="5" />
                    <DeviceRect stroke="#01B757" strokeWidth="1" x="8.5" y="44.5" width="1" height="11" />
                    <path stroke="#01B757" d="M8.90856859,33.9811778 L6.43814432,33.9811778 C5.45301486,34.0503113 4.69477081,33.6889084 4.1634122,32.8969691 C3.36637428,31.7090602 -0.000402169348,26.3761977 0.0748097911,23.2982514 C0.124878873,21.2492429 0.0999525141,14.5598149 3.07156595e-05,3.22996744 C-0.000274213164,3.1963928 0.00243636275,3.162859 0.00812115776,3.12976773 C0.28477346,1.51937083 1.22672004,0.617538852 2.8339609,0.424271782 C4.45813658,0.228968338 6.54411954,0.0875444105 9.09190977,0 L9.09190977,0.0169167084 C11.5566027,0.104886477 13.5814718,0.244169993 15.1665175,0.434768145 C16.7530267,0.625542287 17.6912941,1.50671985 17.9813196,3.07830083 C17.9943481,3.14889902 18.0005888,3.22058224 17.9999563,3.29236974 L17.9999901,3.29237004 C17.9004498,14.5907444 17.875676,21.2628703 17.9256686,23.3087478 C18.0008805,26.3866941 14.6341041,31.7195566 13.8370662,32.9074655 C13.3057075,33.6994047 12.5474635,34.0608076 11.562334,33.9916742 L8.90856859,33.9916742 L8.90856859,33.9811778 Z" />
                    <rect fill="#01B757" x="2" y="7" width="14" height="7" rx="0.5625" />
                </g>
            </ImageWrapper>
        );
    }

    render() {
        return (
            <StyledConnectDevice>
                <Title>
                    <H2 claim>The private bank in your hands.</H2>
                    <P>Trezor Wallet is an easy-to-use interface for your Trezor.</P>
                    <P>Trezor Wallet allows you to easily control your funds, manage your balance and initiate transfers.</P>
                </Title>

                <Wrapper>
                    <ConnectTrezorWrapper>
                        {this.props.showDisconnect && `Unplug "${this.props.deviceLabel}" device`}
                        {!this.props.showDisconnect && (
                            <React.Fragment>
                                {this.getTrezorDeviceImage()}
                                Connect Trezor
                            </React.Fragment>
                        )}
                    </ConnectTrezorWrapper>
                    {this.props.showWebUsb && !this.props.showDisconnect && (
                        <React.Fragment>
                            <StyledP>and</StyledP>
                            <StyledButton isWebUsb>
                                Check for devices
                            </StyledButton>
                        </React.Fragment>
                    )}
                </Wrapper>

                <Image src={CaseImage} />

                <Footer>
                    {this.props.showWebUsb && (
                        <P>
                            <FooterText>Device not recognized?</FooterText>
                            <StyledLink
                                to="/bridge"
                                isGreen
                            >Try installing the Trezor Bridge.
                            </StyledLink>
                        </P>
                    )}
                    <P>
                        <FooterText>
                            Don&apos;t have Trezor?
                        </FooterText>
                        <StyledLink
                            href="https://trezor.io/"
                            isGreen
                        >Get one
                        </StyledLink>
                    </P>
                </Footer>
            </StyledConnectDevice>
        );
    }
}

export default ConnectDevice;
