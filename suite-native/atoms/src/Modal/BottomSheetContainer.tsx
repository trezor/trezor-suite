import React, { ReactNode } from 'react';
import { Modal as RNModal } from 'react-native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

type SheetProps = {
    children: ReactNode;
    isVisible: boolean;
    onClose: () => void;
};

/**
 * On Android RNGH does not work by default because modals are not located under React Native Root view in native hierarchy.
 * To fix that, components need to be wrapped with gestureHandlerRootHOC (it's no-op on iOS and web).
 * See more details: https://docs.swmansion.com/react-native-gesture-handler/docs/installation/#usage-with-modals-on-android
 */
const BottomSheetGestureHandler = gestureHandlerRootHOC(({ children }: { children: ReactNode }) => (
    <>{children}</>
));

export const BottomSheetContainer = ({ children, isVisible, onClose }: SheetProps) => (
    <RNModal transparent visible={isVisible} onRequestClose={onClose}>
        <BottomSheetGestureHandler>{children}</BottomSheetGestureHandler>
    </RNModal>
);
