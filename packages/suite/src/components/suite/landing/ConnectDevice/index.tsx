import React, { PureComponent } from 'react';
import styled, { keyframes } from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { P, H1, Link, colors, variables, animations, Modal } from '@trezor/components';
import WebusbButton from '@suite-components/WebusbButton';
import { SuiteLayout } from '@suite-components';
import l10nMessages from './index.messages';

interface Props {
    deviceLabel: string;
    showWebUsb: boolean;
    showDisconnect: boolean;
    goto: (param: string) => void;
}

const StyledConnectDevice = styled.div`
    padding: 0px 48px;
`;

const Title = styled.div`
    margin-top: 60px;
    max-width: 800px;
    text-align: center;
`;

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    margin: 0 auto;
    padding: 36px 0;
    justify-content: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        align-content: center;
        flex-direction: column;
    }
`;

const ConnectTrezorWrapper = styled.div`
    position: relative;
    animation: ${animations.PULSATE} 1.3s ease-out infinite;
    color: ${colors.GREEN_PRIMARY};
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const And = styled(P)`
    margin: 0px 15px 0px 15px;
    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 15px 0 15px 0;
    }
`;

const ButtonWrapper = styled.div`
    display: flex;
    width: 200px;
`;

const BridgeWrapper = styled.div`
    margin-bottom: 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const Text = styled.span`
    margin-right: 4px;
`;

const StyledLink = styled(Link)`
    font-size: ${variables.FONT_SIZE.BIG};
`;

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

class ConnectDevice extends PureComponent<Props> {
    render() {
        return (
            <SuiteLayout>
                <Modal>
                    <StyledConnectDevice>
                        <Title>
                            <H1>
                                <Translation {...l10nMessages.TR_CONNECT_TREZOR} />
                            </H1>
                        </Title>
                        <Wrapper>
                            <ConnectTrezorWrapper>
                                {this.props.showDisconnect && (
                                    <Translation
                                        {...l10nMessages.TR_UNPLUG_DEVICE_LABEL}
                                        values={{ deviceLabel: this.props.deviceLabel }}
                                    />
                                )}
                                {!this.props.showDisconnect && (
                                    <>
                                        <ImageWrapper
                                            width="12px"
                                            height="35px"
                                            viewBox="0 0 20 57"
                                        >
                                            <g
                                                stroke="none"
                                                strokeWidth="1"
                                                fill="none"
                                                transform="translate(1, 1)"
                                            >
                                                <DeviceRect
                                                    fill="#01B757"
                                                    x="6"
                                                    y="39"
                                                    width="6"
                                                    height="5"
                                                />
                                                <DeviceRect
                                                    stroke="#01B757"
                                                    strokeWidth="1"
                                                    x="8.5"
                                                    y="44.5"
                                                    width="1"
                                                    height="11"
                                                />
                                                <path
                                                    stroke="#01B757"
                                                    d="M8.90856859,33.9811778 L6.43814432,33.9811778 C5.45301486,34.0503113 4.69477081,33.6889084 4.1634122,32.8969691 C3.36637428,31.7090602 -0.000402169348,26.3761977 0.0748097911,23.2982514 C0.124878873,21.2492429 0.0999525141,14.5598149 3.07156595e-05,3.22996744 C-0.000274213164,3.1963928 0.00243636275,3.162859 0.00812115776,3.12976773 C0.28477346,1.51937083 1.22672004,0.617538852 2.8339609,0.424271782 C4.45813658,0.228968338 6.54411954,0.0875444105 9.09190977,0 L9.09190977,0.0169167084 C11.5566027,0.104886477 13.5814718,0.244169993 15.1665175,0.434768145 C16.7530267,0.625542287 17.6912941,1.50671985 17.9813196,3.07830083 C17.9943481,3.14889902 18.0005888,3.22058224 17.9999563,3.29236974 L17.9999901,3.29237004 C17.9004498,14.5907444 17.875676,21.2628703 17.9256686,23.3087478 C18.0008805,26.3866941 14.6341041,31.7195566 13.8370662,32.9074655 C13.3057075,33.6994047 12.5474635,34.0608076 11.562334,33.9916742 L8.90856859,33.9916742 L8.90856859,33.9811778 Z"
                                                />
                                                <rect
                                                    fill="#01B757"
                                                    x="2"
                                                    y="7"
                                                    width="14"
                                                    height="7"
                                                    rx="0.5625"
                                                />
                                            </g>
                                        </ImageWrapper>
                                        <Translation
                                            {...l10nMessages.TR_CONNECT_TREZOR_TO_CONTINUE}
                                        />
                                    </>
                                )}
                            </ConnectTrezorWrapper>
                            {this.props.showWebUsb && !this.props.showDisconnect && (
                                <>
                                    <And>
                                        <Translation {...l10nMessages.TR_AND} />
                                    </And>
                                    <ButtonWrapper>
                                        <WebusbButton ready />
                                    </ButtonWrapper>
                                </>
                            )}
                        </Wrapper>
                        <BridgeWrapper>
                            {this.props.showWebUsb && (
                                <P>
                                    <Text>
                                        <Translation
                                            {...l10nMessages.TR_DEVICE_NOT_RECOGNIZED_TRY_INSTALLING}
                                            values={{
                                                link: (
                                                    <StyledLink
                                                        onClick={() =>
                                                            this.props.goto('suite-bridge')
                                                        }
                                                    >
                                                        Trezor Bridge
                                                    </StyledLink>
                                                ),
                                            }}
                                        />
                                    </Text>
                                </P>
                            )}
                            <P>
                                <Text>
                                    <Translation
                                        {...l10nMessages.TR_DONT_HAVE_A_TREZOR}
                                        values={{
                                            getOne: (
                                                <StyledLink href="https://trezor.io/">
                                                    <Translation {...l10nMessages.TR_GET_ONE} />
                                                </StyledLink>
                                            ),
                                        }}
                                    />
                                </Text>
                            </P>
                        </BridgeWrapper>
                    </StyledConnectDevice>
                </Modal>
            </SuiteLayout>
        );
    }
}

export default ConnectDevice;
