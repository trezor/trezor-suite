export const ON_RESIZE = 'ON_RESIZE';

export type DOMAction = { type: typeof ON_RESIZE };

export const onResize = () => ({
    type: ON_RESIZE,
});
