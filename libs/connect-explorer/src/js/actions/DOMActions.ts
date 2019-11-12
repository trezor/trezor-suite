export const ON_RESIZE = 'ON_RESIZE';

export interface DOMActions {
    type: typeof ON_RESIZE;
}

export const onResize = () => {
    return {
        type: ON_RESIZE,
    };
};

// does nothing, commenting out
// export const onBeforeUnload = () => {
//     return async function(dispatch, getState) {};
// };
