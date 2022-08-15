export default {
    EXPAND: {
        variants: {
            initial: {
                overflow: 'unset',
                height: 'auto',
            },
            visible: {
                height: 'auto',
                transitionEnd: { overflow: 'unset' }, // overflow needs to be unset after animation
            },
        },
        initial: 'initial',
        animate: 'visible',
        exit: 'initial',
        transition: { duration: 0.24, ease: 'easeInOut' },
    },
};

export const transitionEase = [0.65, 0, 0.35, 1];
export const enterEase = [0.33, 1, 0.68, 1];
export const exitEase = [0.32, 0, 0.67, 0];
