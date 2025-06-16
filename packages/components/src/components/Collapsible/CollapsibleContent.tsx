import { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import { useCollapsible } from './Collapsible';
import { motionEasing } from '../../config/motion';
import { Box } from '../Box/Box';

const ANIMATION_DURATION = 0.4;

const Container = styled(motion.div)`
    overflow: hidden;
`;

type CollapsibleContentProps = {
    children: ReactNode;
    'data-testid'?: string;
    onAnimationComplete?: (isOpen: boolean) => void;
};

export const CollapsibleContent = ({
    children,
    onAnimationComplete,
    'data-testid': dataTestId,
}: CollapsibleContentProps) => {
    const { isOpen, contentId, gap } = useCollapsible();

    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <Container
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onAnimationComplete={() => onAnimationComplete?.(isOpen)}
                    transition={{
                        duration: ANIMATION_DURATION,
                        ease: motionEasing.transition,
                        opacity: {
                            ease: isOpen ? motionEasing.exit : motionEasing.enter,
                        },
                    }}
                    data-testid={dataTestId}
                    aria-expanded={isOpen}
                    id={contentId}
                >
                    <Box padding={{ top: gap }}>{children}</Box>
                </Container>
            )}
        </AnimatePresence>
    );
};
