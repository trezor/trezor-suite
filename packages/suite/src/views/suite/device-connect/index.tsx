import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { variables, Link, P, H2, Button } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import { Translation, WebusbButton, Image } from '@suite-components';
import ModalWrapper from '@suite-components/ModalWrapper';
import HelpBuyIcons from '@suite-components/ProgressBar/components/HelpBuyIcons';

import { Dispatch, AppState } from '@suite-types';
import { isWebUSB } from '@suite-utils/transport';

const Title = styled.div`
    margin-top: 60px;
    max-width: 800px;
    text-align: center;
`;

const Wrapper = styled(ModalWrapper)`
    display: flex;
    min-width: 60vw;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        align-content: center;
        flex-direction: column;
    }
`;

const ButtonWrapper = styled.div`
    display: flex;
    margin-bottom: 20px;
`;

const BridgeWrapper = styled.div`
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const StyledLink = styled(Link)``;

const mapStateToProps = (state: AppState) => ({
    transport: state.suite.transport,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => {
    const showWebUsb = isWebUSB(props.transport);
    // we need imageLoaded here so that we can position webusb button properly.
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <Wrapper data-test="@modal/connect-device">
            <HelpBuyIcons showBuy showHelp />
            <Title>
                <H2>
                    <Translation id="TR_CONNECT_TREZOR" />
                </H2>
            </Title>
            <Image
                image="CONNECT_DEVICE"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
            />

            {showWebUsb && (
                <ButtonWrapper>
                    <WebusbButton ready={imageLoaded}>
                        <Button icon="PLUS">
                            <Translation id="TR_CHECK_FOR_DEVICES" />
                        </Button>
                    </WebusbButton>
                </ButtonWrapper>
            )}

            <BridgeWrapper>
                {showWebUsb && (
                    <P size="tiny">
                        <Translation
                            id="TR_DEVICE_NOT_RECOGNIZED_TRY_INSTALLING"
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
                    </P>
                )}
            </BridgeWrapper>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Index);
