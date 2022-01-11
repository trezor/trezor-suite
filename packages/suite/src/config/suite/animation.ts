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
