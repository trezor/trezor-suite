export const motionAnimation = {
    expand: {
        variants: {
            initial: {
                overflow: 'hidden',
                height: 0,
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

export const motionEasing = {
    transition: [0.65, 0, 0.35, 1],
    enter: [0.33, 1, 0.68, 1],
    //  exit easy is not used anywhere?
    exit: [0.32, 0, 0.67, 0],
};
