/* @flow */

import React, { Component } from 'react';
import styled, { keyframes } from 'styled-components';
import TrezorConnect from 'trezor-connect';
import P from 'components/Paragraph';
import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';

type Props = {
    deviceLabel: string,
    showWebUsb: boolean,
    showDisconnect: boolean,
};
class ConnectDevice extends Component<Props> {
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
        const Wrapper = styled.div`
            display: flex;
            justify-content: space-around;
            align-items: center;
            width: 400px;
            margin: 0 auto;
            padding: 36px 0;
        `;

        const animationPulsate = keyframes`
            0%, 100% {
                opacity: 0.5;
            }
            50% {
                opacity: 1.0;
            }
        `;

        const ConnectTrezorWrapper = styled.div`
            position: relative;
            top: 1px;
            animation: ${animationPulsate} 1.3s ease-out infinite;

            color: ${colors.GREEN_PRIMARY};
            font-size: ${FONT_SIZE.BASE};
            font-weight: ${FONT_WEIGHT.BASE};
        `;

        return (
            <Wrapper>
                <ConnectTrezorWrapper>
                    {this.props.showDisconnect && `Unplug "${this.props.deviceLabel}" device`}
                    {!this.props.showDisconnect && (
                        <React.Fragment>
                            {this.getTrezorDeviceImage()}
                            Connect TREZOR
                        </React.Fragment>
                    )}
                </ConnectTrezorWrapper>
                {this.props.showWebUsb && (
                    <React.Fragment>
                        <P>and</P>
                        <button
                            type="button"
                            className="trezor-webusb-button"
                        >
                            Check for devices
                        </button>
                    </React.Fragment>
                )}
            </Wrapper>
        );
    }
}

export default ConnectDevice;
