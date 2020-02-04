import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import * as routerActions from '@suite-actions/routerActions';
import { Translation } from '@suite-components/Translation';
import { Prompt, colors, variables, animations } from '@trezor/components';
import { Link, P, H2 } from '@trezor/components-v2';
import WebusbButton from '@suite-components/WebusbButton';
import messages from '@suite/support/messages';
import { URLS } from '@suite-constants';
import { Dispatch, AppState } from '@suite-types';
import { isWebUSB } from '@suite-utils/transport';
import { resolveStaticPath } from '@suite-utils/nextjs';

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
    display: flex;
    align-items: center;
    animation: ${animations.PULSATE} 1.3s ease-out infinite;
    color: ${colors.GREEN_PRIMARY};
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const PromptWrapper = styled.div`
    margin-right: 20px;
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

const mapStateToProps = (state: AppState) => ({
    transport: state.suite.transport,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => {
    const showWebUsb = isWebUSB(props.transport);
    return (
        <StyledConnectDevice data-test="@modal/connect-device">
            <Title>
                <H2>
                    <Translation {...messages.TR_CONNECT_TREZOR} />
                </H2>
            </Title>
            <img alt="" src={resolveStaticPath('images/suite/connect-device.svg')} />

            <Wrapper>
                <ConnectTrezorWrapper>
                    <PromptWrapper>
                        <Prompt type="connect-device" />
                    </PromptWrapper>
                    <Translation {...messages.TR_CONNECT_TREZOR_TO_CONTINUE} />
                </ConnectTrezorWrapper>
                {showWebUsb && (
                    <>
                        <And>
                            <Translation {...messages.TR_AND} />
                        </And>
                        <ButtonWrapper>
                            <WebusbButton ready />
                        </ButtonWrapper>
                    </>
                )}
            </Wrapper>
            <BridgeWrapper>
                {showWebUsb && (
                    <P>
                        <Text>
                            <Translation
                                {...messages.TR_DEVICE_NOT_RECOGNIZED_TRY_INSTALLING}
                                values={{
                                    link: (
                                        <StyledLink
                                            onClick={() =>
                                                props.goto('suite-bridge', { cancelable: true })
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
                            {...messages.TR_DONT_HAVE_A_TREZOR}
                            values={{
                                getOne: (
                                    <StyledLink href={URLS.TREZOR_URL}>
                                        <Translation {...messages.TR_GET_ONE} />
                                    </StyledLink>
                                ),
                            }}
                        />
                    </Text>
                </P>
            </BridgeWrapper>
        </StyledConnectDevice>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Index);
