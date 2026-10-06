import { type PropsWithChildren } from 'react';
import { Portal } from 'react-native-teleport';

import { KeyboardToolbar } from './KeyboardToolbar';

type KeyboardToolbarPortalProps = {
    hostName: string;
    isVisible?: boolean;
    hasPadding?: boolean;
};

export const KeyboardToolbarPortal = ({
    hostName,
    children,
    isVisible,
    hasPadding,
}: PropsWithChildren<KeyboardToolbarPortalProps>) => (
    <Portal hostName={hostName}>
        <KeyboardToolbar isVisible={isVisible} hasPadding={hasPadding}>
            {children}
        </KeyboardToolbar>
    </Portal>
);
