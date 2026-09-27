import { Platform } from 'react-native';

import { type BottomSheetModalProps } from './LegacyBottomSheetModal';

const nativeSheetProps = new Set([
    'snapPoints',
    'enableDynamicSizing',
    'enablePanDownToClose',
    'backgroundStyle',
    'index',
    'onChange',
    'onDismiss',
]);

export const isNativeSheetSupported = (
    props: BottomSheetModalProps['bottomSheetCustomProps'] = {},
) => {
    // Expo also disables backdrop and Android Back dismissal for this flag.
    if (props.enablePanDownToClose === false) return false;

    if (props.snapPoints !== undefined) {
        // Compose only supports content-dependent partial/expanded states, not exact snap points.
        if (
            Platform.OS === 'android' ||
            !Array.isArray(props.snapPoints) ||
            props.snapPoints.length === 0 ||
            props.enableDynamicSizing !== false
        ) {
            return false;
        }
    } else if (props.enableDynamicSizing === false) {
        return false;
    }

    return Object.keys(props).every(key => nativeSheetProps.has(key));
};
