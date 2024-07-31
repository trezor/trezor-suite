import { ReactNode, ReactText } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface AnimationWrapperProps {
    opened: boolean;
    children?: ReactNode;
    onAnimationStart?: () => void;
    onUpdate?: (latest: { [key: string]: ReactText }) => void;
    onAnimationComplete?: () => void;
    dataTest?: string;
}

export const AnimationWrapper = ({
    opened,
    children,
    onAnimationStart,
    onUpdate,
    onAnimationComplete,
    dataTest,
}: AnimationWrapperProps) => {
    const collapsed = { overflow: 'hidden', height: 0 };

    const animate = {
        height: 'auto',
        transitionEnd: { overflow: 'unset' },
    };

    const transition = { duration: 0.24, ease: 'easeInOut' };

    return (
        <AnimatePresence initial={false}>
            {opened && (
                <motion.div
                    initial={collapsed}
                    animate={animate}
                    exit={collapsed}
                    onAnimationStart={onAnimationStart}
                    onUpdate={onUpdate}
                    onAnimationComplete={onAnimationComplete}
                    transition={transition}
                    data-test={dataTest}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
