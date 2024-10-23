import { ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectDevice } from '@suite-common/wallet-core';
import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

type DeviceInteractionScreenWrapperProps = {
    children: ReactNode;
};

export const DeviceInteractionScreenWrapper = ({
    children,
}: DeviceInteractionScreenWrapperProps) => {
    const device = useSelector(selectDevice);

    const closeAction = useCallback(() => {
        TrezorConnect.cancel();
    }, []);

    if (!device) {
        return null;
    }

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
                    customHorizontalPadding="sp16"
                    closeActionType="close"
                    closeAction={closeAction}
                />
            }
            customHorizontalPadding="sp24"
            hasBottomInset={false}
            isScrollable={false}
        >
            {children}
        </Screen>
    );
};
