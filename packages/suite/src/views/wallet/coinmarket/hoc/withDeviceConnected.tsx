import React, { useEffect, useState } from 'react';
import { useDevice } from '@suite-hooks';
import { DeviceConnect } from '@suite-views';

export interface WithDeviceConnectedProps {
    setIsDeviceConnectVisible: (isDeviceConnectVisible: boolean) => void;
}

const withDeviceConnected = <TComponentProps extends WithDeviceConnectedProps>(
    Component: React.ComponentType<TComponentProps>,
) => (props: Omit<TComponentProps, keyof WithDeviceConnectedProps>) => {
    const { device } = useDevice();
    const isDeviceConnected = !!device?.connected;

    const [isDeviceConnectVisible, setIsDeviceConnectVisible] = useState(!isDeviceConnected);

    useEffect(() => {
        setIsDeviceConnectVisible(!isDeviceConnected);
    }, [isDeviceConnected]);

    return (
        <>
            <Component
                {...(props as TComponentProps)}
                setIsDeviceConnectVisible={setIsDeviceConnectVisible}
            />
            {isDeviceConnectVisible ? (
                <DeviceConnect cancelable onCancel={() => setIsDeviceConnectVisible(false)} />
            ) : null}
        </>
    );
};

export default withDeviceConnected;
