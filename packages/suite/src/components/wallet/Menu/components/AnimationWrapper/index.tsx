import React, { useEffect } from 'react';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';

interface Props {
    opened: boolean;
    children?: React.ReactNode;
    updateOverflow?: boolean;
    onAnimationStart?: () => {};
    onAnimationComplete?: () => {};
}

export default ({
    opened,
    children,
    updateOverflow,
    onAnimationStart,
    onAnimationComplete,
}: Props) => {
    // style.overflow cannot be animated and needs to be added as style into `motion.div`
    // once animation is complete it will be switched to `unset`.
    // `unset` is essential for position: sticky in children items
    // however it needs to be switched back to `hidden` whenever `opened` props change to false (motion.div.onAnimationStart will not help here)

    const controls = useAnimation();
    const expanded = { height: 'auto' };
    const collapsed = { height: 0 };

    if (updateOverflow) {
        // console.warn('updateOverflow', opened);
        useEffect(() => {
            const sequenceOpen = async () => {
                console.warn('sequenceOpen');
                await controls.start(expanded);
                await controls.start({
                    overflow: 'unset',
                    position: 'sticky',
                    transition: { duration: 0.01 },
                });
            };
            const sequenceClose = async () => {
                // console.warn('sequenceClose');
                await controls.start({
                    overflow: 'auto',
                    position: 'unset',
                    transition: { duration: 0.01 },
                });
                await controls.start(collapsed);
            };
            if (opened) {
                sequenceOpen();
            } else {
                sequenceClose();
            }
        }, [collapsed, controls, expanded, opened]);
    }
    // animate={updateOverflow ? controls : 'expanded'}

    const animateFn = updateOverflow ? controls : 'expanded';
    // const animateFn = 'expanded';
    // if (typeof animate === 'boolean' && !animate) animateFn = undefined;

    return (
        <AnimatePresence initial={false}>
            {opened && (
                <motion.div
                    style={{ overflow: 'hidden' }}
                    initial="collapsed"
                    animate={animateFn}
                    exit="collapsed"
                    onAnimationStart={onAnimationStart}
                    onAnimationComplete={onAnimationComplete}
                    variants={{
                        expanded,
                        collapsed,
                    }}
                    transition={{ duration: 0.24, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
