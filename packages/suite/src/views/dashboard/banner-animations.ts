import { motionEasing } from '@trezor/components';

export const bannerAnimationConfigWithInitialAnimation = {
    initial: { opacity: 0, transform: 'translateY(10px) scale(0.95)', height: 0 },
    animate: { opacity: 1, transform: 'translateY(0) scale(1)', height: 'auto' },
    exit: { opacity: 0, transform: 'translateY(10px) scale(0.95)', height: 0 },
    transition: {
        duration: 0.33,
        ease: motionEasing.transition,
        height: {
            duration: 0.23,
            ease: motionEasing.transition,
        },
        opacity: {
            duration: 0.23,
            ease: motionEasing.transition,
        },
        transform: {
            duration: 0.23,
            ease: motionEasing.transition,
        },
    },
};

export const bannerAnimationConfig = {
    initial: { opacity: 1, transform: 'scale(1)' },
    exit: { opacity: 0, transform: 'scale(0.7)', height: 0 },
    transition: {
        duration: 0.33,
        ease: motionEasing.transition,
        height: {
            duration: 0.23,
            ease: motionEasing.transition,
        },
        opacity: {
            duration: 0.23,
            ease: motionEasing.transition,
        },
    },
};
