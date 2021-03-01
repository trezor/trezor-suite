import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { Link, P, H2, Button } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import { Translation, WebusbButton, ConnectDeviceImage, Modal } from '@suite-components';
import HelpBuyIcons from '@suite-components/ProgressBar/components/HelpBuyIcons';
import { Dispatch, AppState } from '@suite-types';
import { isWebUSB } from '@suite-utils/transport';
import { getLinuxPackage } from '@suite-utils/bridge';
import { isAndroid } from '@suite-utils/env';

const Title = styled.div`
    margin-top: 60px;
    text-align: center;
`;

const ButtonWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
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

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goto: routerActions.goto,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => {
    const showWebUsb = isWebUSB(props.transport);
    const showUdev = getLinuxPackage();
    // we need imageLoaded here so that we can position webusb button properly.
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <Modal data-test="@modal/connect-device" centerContent>
            <HelpBuyIcons showBuy showHelp />
            <Title>
                <H2>
                    <Translation id="TR_CONNECT_TREZOR" />
                </H2>
            </Title>
            <ConnectDeviceImage
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
            />
            {showWebUsb && (
                <ButtonWrapper>
                    <WebusbButton ready={imageLoaded}>
                        <Button icon="PLUS" data-test="@modal/connect-device/webusb-button">
                            <Translation id="TR_CHECK_FOR_DEVICES" />
                        </Button>
                    </WebusbButton>
                </ButtonWrapper>
            )}
            {showUdev && (
                <BridgeWrapper>
                    <P size="tiny">
                        <Translation
                            id="TR_DEVICE_NOT_RECOGNIZED_TRY_UDEV"
                            values={{
                                link: (
                                    <StyledLink
                                        onClick={() =>
                                            props.goto('suite-udev', { cancelable: true })
                                        }
                                        data-test="@modal/connect-device/goto/suite-udev"
                                    >
                                        Udev rules
                                    </StyledLink>
                                ),
                            }}
                        />
                    </P>
                </BridgeWrapper>
            )}
            {showWebUsb && !isAndroid() && (
                <BridgeWrapper>
                    <P size="tiny">
                        <Translation
                            id="TR_DEVICE_NOT_RECOGNIZED_TRY_BRIDGE"
                            values={{
                                link: (
                                    <StyledLink
                                        onClick={() =>
                                            props.goto('suite-bridge', { cancelable: true })
                                        }
                                        data-test="@modal/connect-device/goto/suite-bridge"
                                    >
                                        Trezor Bridge
                                    </StyledLink>
                                ),
                            }}
                        />
                    </P>
                </BridgeWrapper>
            )}
        </Modal>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Index);
