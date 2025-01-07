import { ReactNode } from 'react';

import styled from 'styled-components';
import { motion } from 'framer-motion';

import { useCollapsible } from './Collapsible';
import { motionEasing } from '../../config/motion';

const ANIMATION_DURATION = 0.4;

const animationVariants = {
    closed: {
        opacity: 0,
        height: 0,
        transitionEnd: {
            display: 'none',
        },
    },
    expanded: {
        opacity: 1,
        height: 'auto',
        display: 'block',
    },
};

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
    const { isOpen, contentId } = useCollapsible();

    return (
        <Container
            initial={false}
            variants={animationVariants}
            animate={isOpen ? 'expanded' : 'closed'}
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
            {children}
        </Container>
    );
};
