import { type PressableProps } from 'react-native';

export const hasUnsupportedNativeButtonProps = (props: PressableProps) =>
    Object.keys(props).some(
        key =>
            key === 'onLongPress' ||
            key === 'onHoverIn' ||
            key === 'onHoverOut' ||
            key === 'onFocus' ||
            key === 'onBlur' ||
            key.startsWith('onTouch') ||
            key.startsWith('onResponder') ||
            key.includes('ShouldSetResponder') ||
            key === 'android_ripple' ||
            key === 'android_disableSound' ||
            key === 'unstable_pressDelay' ||
            key === 'hitSlop' ||
            key === 'pressRetentionOffset',
    );
