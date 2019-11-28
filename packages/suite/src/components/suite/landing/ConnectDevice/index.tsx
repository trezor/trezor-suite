import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { P, H1, Link, variables, Modal } from '@trezor/components';
import WebusbButton from '@suite-components/WebusbButton';
import { SuiteLayout } from '@suite-components';
import l10nMessages from './index.messages';

interface Props {
    deviceLabel: string;
    showWebUsb: boolean;
    showDisconnect: boolean;
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

const StyledH1 = styled(H1)`
    font-size: ${variables.FONT_SIZE.HUGE};
`;

class ConnectDevice extends PureComponent<Props> {
    render() {
        return (
            <SuiteLayout isLanding>
                <Modal>
                    <StyledConnectDevice>
                        <Title>
                            <StyledH1>
                                <FormattedMessage {...l10nMessages.TR_CONNECT_TREZOR} />
                            </StyledH1>
                        </Title>
                        <Wrapper>
                            {this.props.showWebUsb && !this.props.showDisconnect && (
                                <React.Fragment>
                                    <And>
                                        <FormattedMessage {...l10nMessages.TR_AND} />
                                    </And>
                                    <ButtonWrapper>
                                        <WebusbButton ready />
                                    </ButtonWrapper>
                                </React.Fragment>
                            )}
                        </Wrapper>
                        <BridgeWrapper>
                            {this.props.showWebUsb && (
                                <P>
                                    <Text>
                                        <FormattedMessage
                                            {...l10nMessages.TR_DEVICE_NOT_RECOGNIZED_TRY_INSTALLING}
                                            values={{
                                                link: (
                                                    <StyledLink to="/bridge">
                                                        Trezor Bridge
                                                    </StyledLink>
                                                ),
                                            }}
                                        />
                                    </Text>
                                </P>
                            )}
                        </BridgeWrapper>
                    </StyledConnectDevice>
                </Modal>
            </SuiteLayout>
        );
    }
}

export default ConnectDevice;
