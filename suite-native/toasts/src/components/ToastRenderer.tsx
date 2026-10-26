import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAtomValue } from 'jotai';

import { Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { toastsAtom } from '../toastsAtoms';
import { Toast } from './Toast';

const toastsContainerStyle = prepareNativeStyle<{ insets: EdgeInsets }>(
    ({ spacings }, { insets }) => ({
        position: 'absolute',
        left: insets.left,
        right: insets.right,
        justifyContent: 'center',
        // top margin = screen top padding + screen header top padding
        marginTop: Math.max(insets.top, spacings.sp8) + spacings.sp8,
        paddingHorizontal: spacings.sp16,
    }),
);

export const ToastRenderer = () => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();
    const toasts = useAtomValue(toastsAtom);

    return (
        <Box
            pointerEvents="none"
            style={applyStyle(toastsContainerStyle, {
                insets,
            })}
        >
            <VStack alignItems="center">
                {toasts.map(toast => (
                    <Toast toast={toast} key={toast.id} />
                ))}
            </VStack>
        </Box>
    );
};
