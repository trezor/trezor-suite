import { ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

type DeviceInteractionScreenWrapperProps = {
    hasHeader?: boolean;
    children: ReactNode;
};

export const DeviceInteractionScreenWrapper = ({
    hasHeader = true,
    children,
}: DeviceInteractionScreenWrapperProps) => {
    const device = useSelector(selectSelectedDevice);

    const closeAction = useCallback(() => {
        TrezorConnect.cancel();
    }, []);

    if (!device) {
        return null;
    }

    return (
        <Screen
            header={hasHeader && <ScreenHeader closeActionType="close" closeAction={closeAction} />}
            hasBottomInset={false}
            isScrollable={false}
        >
            {children}
        </Screen>
    );
};
