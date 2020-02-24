import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { colors, Icon } from '@trezor/components';
import Divider from '../Divider';
import DeviceIcon from '@suite-components/images/DeviceIcon';
import { Props as ContainerProps } from '../../Container';
import { MENU_PADDING } from '@suite-constants/menu';
import { SHAKE } from '@suite-support/styles/animations';

const Wrapper = styled.div`
    padding-left: ${MENU_PADDING}px;
    background: ${colors.BLACK17};
    display: flex;
    flex-direction: column;
`;

const DeviceStatus = styled.div``;

const DeviceRow = styled.div<{ triggerAnim?: boolean }>`
    height: 36px;
    color: ${colors.WHITE};
    margin-top: 14px;
    display: flex;
    font-weight: bold;
    font-size: 90%;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    padding-left: 10px;
    padding-right: 10px;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;

    ${props =>
        props.triggerAnim &&
        css`
            animation: ${SHAKE} 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden; /* used for hardware acceleration */
            perspective: 1000px; /* used for hardware acceleration */
        `}

    &:hover {
        background-color: ${colors.BLACK25};
    }
`;

const DeviceLabel = styled.div`
    color: ${colors.WHITE};
    padding-left: 5px;
    display: flex;
    flex: 1;
`;

const DeviceIconWrapper = styled.div`
    padding-top: 2px;
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
`;

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
            <DeviceStatus>
                {!props.selectedDevice && <DeviceRow />}
                {props.selectedDevice && (
                    <DeviceRow
                        data-test="@menu/switch-device"
                        onClick={() => props.goto('suite-switch-device', { cancelable: true })}
                        triggerAnim={triggerAnim}
                    >
                        <DeviceIconWrapper>
                            <DeviceIcon
                                size={12}
                                color={colors.GREEN}
                                device={props.selectedDevice}
                            />
                        </DeviceIconWrapper>
                        <DeviceLabel>{props.selectedDevice.label}</DeviceLabel>
                        <IconWrapper>
                            <Icon size={7} color={colors.WHITE} icon="ARROW_RIGHT" />
                        </IconWrapper>
                    </DeviceRow>
                )}
            </DeviceStatus>
            <Divider />
        </Wrapper>
    );
};

export default TopMenu;
