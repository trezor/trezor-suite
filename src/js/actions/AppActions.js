/* @flow */
'use strict';

export const ON_RESIZE: string = 'ON_RESIZE';
export const ON_BEFORE_UNLOAD: string = 'app__on_before_unload';
export const TOGGLE_DEVICE_DROPDOWN: string = 'TOGGLE_DEVICE_DROPDOWN';
export const RESIZE_CONTAINER: string = 'RESIZE_CONTAINER';

export const onResize = (): any => {
    return {
        type: ON_RESIZE
    }
}

export const onBeforeUnload = (): any => {
    return {
        type: ON_BEFORE_UNLOAD
    }
}

export const resizeAppContainer = (opened: boolean): any => {
    return {
        type: RESIZE_CONTAINER,
        opened
    }
}

export const toggleDeviceDropdown = (opened: boolean): any => {
    return {
        type: TOGGLE_DEVICE_DROPDOWN,
        opened
    }
}
