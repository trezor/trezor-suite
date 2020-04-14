import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { colors, Icon, variables } from '@trezor/components';
import Divider from '../Divider';
import DeviceIcon from '@suite-components/images/DeviceIcon';
import { Props as ContainerProps } from '../../Container';
import { SHAKE } from '@suite-support/styles/animations';
import { Translation } from '@suite-components';
import { TrezorDevice } from '@suite-types';

const Wrapper = styled.div`
    padding-left: 6px;
    background: ${colors.BLACK17};
    display: flex;
    flex-direction: column;
`;

const DeviceStatus = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 16px;
    padding: 12px 6px;
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
    cursor: pointer;

    &:hover {
        background-color: ${colors.BLACK25};
    }
`;

const DeviceRow = styled.div<{ triggerAnim?: boolean }>`
    display: flex;
    /* height: 36px; */
    color: ${colors.WHITE};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: bold;
    align-items: center;
    justify-content: space-between;

    ${props =>
        props.triggerAnim &&
        css`
            animation: ${SHAKE} 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden; /* used for hardware acceleration */
            perspective: 1000px; /* used for hardware acceleration */
        `}
`;

const WalletRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK70};
    font-weight: 500;
    margin-top: 6px;
    min-height: 16px;
`;

const DeviceLabel = styled.div`
    color: ${colors.WHITE};
    display: flex;
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const DeviceIconWrapper = styled.div`
    padding-top: 2px;
    flex: 0;
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const getWalletName = (device?: TrezorDevice) => {
    if (!device) return null;
    if (device.useEmptyPassphrase) {
        return <Translation id="TR_STANDARD_WALLET" />;
    }
    if (device.state) {
        return <Translation id="TR_HIDDEN_WALLET" values={{ id: device.instance }} />;
    }
    return null;
};

interface Props {
    selectedDevice: ContainerProps['selectedDevice'];
    goto: ContainerProps['goto'];
    deviceCount: number;
}

const TopMenu = (props: Props) => {
    const { deviceCount } = props;
    const [localCount, setLocalCount] = useState<number | null>(null);
    const [triggerAnim, setTriggerAnim] = useState(false);

    const countChanged = localCount && localCount !== deviceCount;
    const timerRef = useRef<number | undefined>(undefined);

    const walletName = getWalletName(props.selectedDevice);

    useEffect(() => {
        // clear timer on unmount
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    useEffect(() => {
        // update previous device count
        setLocalCount(deviceCount);
    }, [deviceCount]);

    useEffect(() => {
        if (countChanged) {
            // different count triggers anim
            setTriggerAnim(true);
            // after 1s removes anim, allowing it to restart later
            timerRef.current = setTimeout(() => {
                // makes sure component is still mounted
                setTriggerAnim(false);
            }, 1000);
        }
    }, [countChanged]);

    return (
        <Wrapper>
            <DeviceStatus
                data-test="@menu/switch-device"
                onClick={() => props.goto('suite-switch-device', { cancelable: true })}
            >
                {!props.selectedDevice && <DeviceRow />}
                {props.selectedDevice && (
                    <>
                        <DeviceRow triggerAnim={triggerAnim}>
                            <DeviceLabel>{props.selectedDevice.label}</DeviceLabel>
                            <DeviceIconWrapper>
                                <DeviceIcon
                                    size={16}
                                    color={colors.GREEN}
                                    device={props.selectedDevice}
                                />
                            </DeviceIconWrapper>
                        </DeviceRow>
                        <WalletRow>
                            {/* TODO: labeling support */}
                            {walletName && (
                                <>
                                    {walletName}
                                    <IconWrapper>
                                        <Icon size={16} color={colors.BLACK70} icon="ARROW_RIGHT" />
                                    </IconWrapper>
                                </>
                            )}
                        </WalletRow>
                    </>
                )}
            </DeviceStatus>
            <Divider />
        </Wrapper>
    );
};

export default TopMenu;
