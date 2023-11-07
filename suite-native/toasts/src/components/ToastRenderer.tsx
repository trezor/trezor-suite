import { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAtomValue } from 'jotai';

import { Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { toastsAtom } from '../toastsAtoms';
import { Toast } from './Toast';

type ToastRendererProps = {
    children: ReactNode;
};

const toastsContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (utils, { topSafeAreaInset }) => ({
        width: '100%',
        position: 'absolute',
        justifyContent: 'center',
        marginTop: topSafeAreaInset,
        paddingHorizontal: utils.spacings.m,
    }),
);

export const ToastRenderer = ({ children }: ToastRendererProps) => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useSafeAreaInsets();
    const toasts = useAtomValue(toastsAtom);

    return (
        <>
            {children}
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
        </>
    );
};
