import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
    opened: boolean;
    children?: React.ReactNode;
    onAnimationStart?: () => void;
    onUpdate?: (latest: { [key: string]: React.ReactText }) => void;
    onAnimationComplete?: () => void;
}

export default ({ opened, children, onAnimationStart, onUpdate, onAnimationComplete }: Props) => {
    const collapsed = { overflow: 'hidden', height: 0 };
    return (
        <AnimatePresence initial={false}>
            {opened && (
                <motion.div
                    initial={collapsed}
                    animate={{
                        height: 'auto',
                        transitionEnd: { overflow: 'unset', position: 'sticky' },
                    }}
                    exit={collapsed}
                    onAnimationStart={onAnimationStart}
                    onUpdate={onUpdate}
                    onAnimationComplete={onAnimationComplete}
                    transition={{ duration: 0.24, ease: 'easeInOut' }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
