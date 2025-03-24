import { motionEasing } from '@trezor/components';

export const bannerAnimationConfig = {
    initial: { opacity: 1, transform: 'scale(1)' },
    exit: { opacity: 0, transform: 'scale(0.9)', height: 0, margin: 0 },
    transition: {
        duration: 0.33,
        ease: motionEasing.transition,
        height: {
            duration: 0.23,
            ease: motionEasing.transition,
        },
        opacity: {
            duration: 0.2,
            ease: motionEasing.transition,
        },
    },
};
