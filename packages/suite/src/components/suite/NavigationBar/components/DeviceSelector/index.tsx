import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { colors, variables, DeviceImage } from '@trezor/components';
import { SHAKE } from '@suite-support/styles/animations';
import { Translation } from '@suite-components';
import { TrezorDevice } from '@suite-types';
import * as routerActions from '@suite-actions/routerActions';
import { useAnalytics, useSelector, useActions } from '@suite-hooks';
import * as suiteActions from '@suite-actions/suiteActions';
import * as deviceUtils from '@suite-utils/device';
import DeviceStatus from './components/DeviceStatus';

const Wrapper = styled.div<{ triggerAnim?: boolean }>`
    display: flex;
    position: relative;
    width: 288px;
    padding: 12px;
    align-items: center;
    background-color: ${colors.NEUE_BG_LIGHT_GREY};
    cursor: pointer;

    &:hover {
        border-radius: 4px;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    }

    ${props =>
        props.triggerAnim &&
        css`
            animation: ${SHAKE} 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden; /* used for hardware acceleration */
            perspective: 1000px; /* used for hardware acceleration */
        `}
`;

const DeviceLabel = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
`;

const DeviceImageWrapper = styled.div<{ lowerOpacity: boolean }>`
    margin-right: 12px;
    flex: 0;
    ${props =>
        props.lowerOpacity &&
        css`
            opacity: 0.4;
        `}
`;

const WalletNameWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
`;

const DeviceDetail = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const getWalletName = (device?: TrezorDevice) => {
    if (!device) return null;
    if (device.useEmptyPassphrase) {
        return <Translation id="TR_STANDARD_WALLET" />;
    }
    if (device.state) {
        return <Translation id="TR_HIDDEN_WALLET" values={{ id: device.instance }} />;
    }
    return <Translation id="TR_UNDISCOVERED_WALLET" />;
};

const needsRefresh = (device?: TrezorDevice) => {
    if (!device) return false;

    const deviceStatus = deviceUtils.getStatus(device);
    const needsAcquire =
        device.type === 'unacquired' ||
        deviceStatus === 'used-in-other-window' ||
        deviceStatus === 'was-used-in-other-window';
    return needsAcquire;
};

const DeviceSelector = (props: React.HTMLAttributes<HTMLDivElement>) => {
    const selectedDevice = useSelector(state => state.suite.device);
    const deviceCount = useSelector(state => state.devices).length;
    const { goto, acquireDevice } = useActions({
        goto: routerActions.goto,
        acquireDevice: suiteActions.acquireDevice,
    });

    const [localCount, setLocalCount] = useState<number | null>(null);
    const [triggerAnim, setTriggerAnim] = useState(false);

    const countChanged = localCount && localCount !== deviceCount;
    const timerRef = useRef<number | undefined>(undefined);

    const walletName = getWalletName(selectedDevice);
    const analytics = useAnalytics();

    const deviceNeedsRefresh = needsRefresh(selectedDevice);

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
        <Wrapper
            data-test="@menu/switch-device"
            onClick={() =>
                goto('suite-switch-device', {
                    cancelable: true,
                }) && analytics.report({ type: 'menu/goto/switch-device' })
            }
            triggerAnim={triggerAnim}
            {...props}
        >
            {selectedDevice && (
                <>
                    <DeviceImageWrapper lowerOpacity={deviceNeedsRefresh}>
                        <DeviceImage
                            height={36}
                            trezorModel={selectedDevice.features?.major_version === 1 ? 1 : 2}
                        />
                    </DeviceImageWrapper>
                    <DeviceDetail>
                        <DeviceLabel>{selectedDevice.label}</DeviceLabel>
                        {walletName && <WalletNameWrapper>{walletName}</WalletNameWrapper>}
                    </DeviceDetail>
                    <DeviceStatus
                        device={selectedDevice}
                        onRefreshClick={
                            deviceNeedsRefresh
                                ? () => {
                                      acquireDevice(selectedDevice);
                                  }
                                : undefined
                        }
                    />
                </>
            )}
        </Wrapper>
    );
};

export default DeviceSelector;
