import { type RefObject, useContext, useEffect } from 'react';

import { NativeSheetContext, NativeSheetPresentationContext } from '../Sheet/NativeSheetContext';

export const useNativeSheetAutoFocus = (
    inputRef: RefObject<{ focus: () => void } | null>,
    autoFocus?: boolean,
) => {
    const isNativeSheet = useContext(NativeSheetContext);
    const isPresented = useContext(NativeSheetPresentationContext);

    useEffect(() => {
        if (isNativeSheet && isPresented && autoFocus) inputRef.current?.focus();
    }, [autoFocus, inputRef, isNativeSheet, isPresented]);

    // RN's attach-time autofocus runs before a native sheet can accept keyboard focus.
    return isNativeSheet ? false : autoFocus;
};
