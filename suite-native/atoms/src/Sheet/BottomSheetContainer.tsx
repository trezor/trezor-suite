import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal as RNModal, Platform } from 'react-native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type SheetProps = {
    children: ReactNode;
    isVisible: boolean;
    onClose: () => void;
};

const ContentWrapperStyle = prepareNativeStyle(_ => ({ flex: 1 }));

/**
 * On Android RNGH does not work by default because modals are not located under React Native Root view in native hierarchy.
 * To fix that, components need to be wrapped with gestureHandlerRootHOC (it's no-op on iOS and web).
 * See more details: https://docs.swmansion.com/react-native-gesture-handler/docs/installation/#usage-with-modals-on-android
 */
const BottomSheetGestureHandler = gestureHandlerRootHOC<{ children: ReactNode }>(({ children }) => (
    <>{children}</>
));

export const BottomSheetContainer = ({ children, isVisible, onClose }: SheetProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <RNModal transparent visible={isVisible} onRequestClose={onClose}>
            <BottomSheetGestureHandler>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={applyStyle(ContentWrapperStyle)}
                >
                    {children}
                </KeyboardAvoidingView>
            </BottomSheetGestureHandler>
        </RNModal>
    );
};
