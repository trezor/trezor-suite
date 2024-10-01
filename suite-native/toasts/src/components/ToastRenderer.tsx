import { useAtomValue } from 'jotai';

import { useOfflineBannerAwareSafeAreaInsets } from '@suite-native/connection-status';
import { Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { toastsAtom } from '../toastsAtoms';
import { Toast } from './Toast';

const toastsContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (utils, { topSafeAreaInset }) => ({
        width: '100%',
        position: 'absolute',
        justifyContent: 'center',
        marginTop: topSafeAreaInset,
        paddingHorizontal: utils.spacings.sp16,
    }),
);

export const ToastRenderer = () => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useOfflineBannerAwareSafeAreaInsets();
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
