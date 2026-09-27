import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { type BottomSheetModalProps, LegacyBottomSheetModal } from './LegacyBottomSheetModal';
import { NativeBottomSheetModal } from './NativeBottomSheetModal';
import { NativeSheetContext } from './NativeSheetContext';
import { nativeSheetManager } from './createNativeSheetManager';
import { isNativeSheetSupported } from './isNativeSheetSupported';

export type { BottomSheetModalProps, BottomSheetModalRef } from './LegacyBottomSheetModal';

export type ManagedBottomSheetModalMethods = BottomSheetModalMethods & {
    presentNested: () => void;
};

export const BottomSheetModal = forwardRef<BottomSheetModalMethods, BottomSheetModalProps>(
    ({ bottomSheetCustomProps, onDismiss, ...props }, ref) => {
        const innerRef = useRef<BottomSheetModalMethods>(null);
        const [sheet] = useState(() => ({
            present: () => innerRef.current?.present(),
            dismiss: () => innerRef.current?.dismiss(),
        }));
        const isNative = isNativeSheetSupported(bottomSheetCustomProps);

        useEffect(
            () => () => {
                nativeSheetManager.dismiss(sheet);
                nativeSheetManager.didDismiss(sheet);
            },
            [sheet],
        );

        useImperativeHandle(ref, (): ManagedBottomSheetModalMethods => ({
            present: () => nativeSheetManager.present(sheet),
            presentNested: () => nativeSheetManager.present(sheet, true),
            dismiss: () => nativeSheetManager.dismiss(sheet),
            close: () => nativeSheetManager.dismiss(sheet),
            forceClose: () => nativeSheetManager.dismiss(sheet),
            expand: (...args) => {
                if (nativeSheetManager.isOpen(sheet)) innerRef.current?.expand(...args);
            },
            collapse: (...args) => {
                if (nativeSheetManager.isOpen(sheet)) innerRef.current?.collapse(...args);
            },
            snapToIndex: (index, ...args) => {
                if (index === -1) nativeSheetManager.dismiss(sheet);
                else if (nativeSheetManager.isOpen(sheet)) {
                    innerRef.current?.snapToIndex(index, ...args);
                }
            },
            snapToPosition: (...args) => {
                if (nativeSheetManager.isOpen(sheet)) innerRef.current?.snapToPosition(...args);
            },
        }));

        const handleDismiss = () => {
            (bottomSheetCustomProps?.onDismiss ?? onDismiss)?.();
            nativeSheetManager.didDismiss(sheet);
        };

        const handlePresented = () => nativeSheetManager.didPresent(sheet);
        const handleChange = (index: number) => {
            if (index < 0 || nativeSheetManager.isOpen(sheet)) {
                bottomSheetCustomProps?.onChange?.(index);
            }
        };

        return (
            <NativeSheetContext.Provider value={isNative}>
                {isNative ? (
                    <NativeBottomSheetModal
                        {...props}
                        ref={innerRef}
                        bottomSheetCustomProps={{
                            ...bottomSheetCustomProps,
                            onChange: handleChange,
                        }}
                        onDismiss={handleDismiss}
                        onPresented={handlePresented}
                        onCloseRequested={() => nativeSheetManager.dismiss(sheet)}
                    />
                ) : (
                    <LegacyBottomSheetModal
                        {...props}
                        ref={innerRef}
                        bottomSheetCustomProps={{
                            ...bottomSheetCustomProps,
                            onDismiss: handleDismiss,
                            onChange: index => {
                                if (index >= 0) handlePresented();
                                handleChange(index);
                            },
                        }}
                    />
                )}
            </NativeSheetContext.Provider>
        );
    },
);
