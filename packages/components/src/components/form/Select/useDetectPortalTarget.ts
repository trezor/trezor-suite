import { RefObject, useEffect, useState } from 'react';
import { SelectInstance } from 'react-select';

import type { Option } from './Select';
import { MODAL_CONTENT_ID } from '../../Modal/Modal';

export const useDetectPortalTarget = (selectRef: RefObject<SelectInstance<Option, boolean>>) => {
    const [menuPortalTarget, setMenuPortalTarget] = useState<HTMLElement | null>(null);
    // Check if the select is within a modal. If so, render it inside a portal so that it can overflow the modal.
    // The inputRef is deeply nested so we iterate with while loop until wee reach the parentElement or max depth.
    // The depth has a limit so that it does not iterate over the entire DOM.
    // The depth limit has a buffer of 2 iterations in case the select is wrapped. (Minimum depth is 4.)

    // UPDATE (2025-06-02): There is a lot more wrapping now, just in the modal itself there's 4 layers of wrapping.
    // So I increased the depth limit to 15 iterations.
    useEffect(() => {
        let parent = selectRef.current?.inputRef?.parentElement;
        let count = 0;
        while (parent) {
            if (parent.id === MODAL_CONTENT_ID) {
                setMenuPortalTarget(document.body);
                break;
            }
            if (count > 15) {
                break;
            }
            parent = parent.parentElement;
            count++;
        }
    }, [selectRef]);

    return menuPortalTarget;
};
