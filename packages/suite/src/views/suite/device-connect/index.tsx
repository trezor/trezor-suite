// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceConnect

import React from 'react';
import styled from 'styled-components';
import { Link, P, H2 } from '@trezor/components';
import { useSelector, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { Translation, WebusbButton, ConnectDeviceImage, Modal } from '@suite-components';
import HelpBuyIcons from '@suite-components/ProgressBar/components/HelpBuyIcons';
import { isWebUSB } from '@suite-utils/transport';
import { isAndroid, isLinux } from '@suite-utils/env';

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

const Index = () => {
    const transport = useSelector(state => state.suite.transport);
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const showWebUsb = isWebUSB(transport);
    const showUdev = isLinux();

    return (
        <Modal data-test="@modal/connect-device" centerContent>
            <HelpBuyIcons showBuy showHelp />
            <Title>
                <H2>
                    <Translation id="TR_CONNECT_TREZOR" />
                </H2>
            </Title>
            <ConnectDeviceImage />
            {showWebUsb && (
                <ButtonWrapper>
                    <WebusbButton data-test="@modal/connect-device/webusb-button" />
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
                                        onClick={() => goto('suite-udev', { cancelable: true })}
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
                                        onClick={() => goto('suite-bridge', { cancelable: true })}
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

export default Index;
