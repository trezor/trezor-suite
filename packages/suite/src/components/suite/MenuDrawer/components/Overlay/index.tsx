import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Background = styled(motion.div)`
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1;
`;

export default ({ onClick }: { onClick: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const { current } = ref;
        if (!current) return;
        current.addEventListener('mousedown', onClick);
        current.addEventListener('touchstart', onClick);

        return () => {
            current.removeEventListener('mousedown', onClick);
            current.removeEventListener('touchstart', onClick);
        };
    }, [onClick, ref]);

    return (
        <Background
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        />
    );
};
