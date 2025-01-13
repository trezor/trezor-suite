import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAtomValue } from 'jotai';

import { Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { toastsAtom } from '../toastsAtoms';
import { Toast } from './Toast';

const toastsContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    ({ spacings }, { topSafeAreaInset }) => ({
        width: '100%',
        position: 'absolute',
        justifyContent: 'center',
        // top margin = screen top padding + screen header top padding
        marginTop: Math.max(topSafeAreaInset, spacings.sp8) + spacings.sp8,
        paddingHorizontal: spacings.sp16,
    }),
);

export const ToastRenderer = () => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useSafeAreaInsets();
    const toasts = useAtomValue(toastsAtom);

    return (
        <Box
            pointerEvents="none"
            style={applyStyle(toastsContainerStyle, {
                topSafeAreaInset,
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
