import { useEffect, useRef, useState } from 'react';

import { AnimatePresence, type BezierDefinition, type Variants, motion } from 'framer-motion';
import styled from 'styled-components';

import { Box, Column, Grid, Row } from '@trezor/components';

import { CarouselIndicator } from './CarouselIndicator';

const Slide = styled(motion.div)`
    grid-area: 1 / 1;
    width: 100%;
`;

const slideTransition = {
    duration: 0.6,
    ease: [0.25, 0.46, 0.45, 0.94] as BezierDefinition,
};

const slideVariants: Variants = {
    enter: (direction: number) => ({ x: `${direction * 100}%` }),
    center: { x: '0%' },
    exit: (direction: number) => ({ x: `${direction * -100}%` }),
};

export type CarouselBanner = {
    key: string;
    render: (handlers: { onClose: () => void; onCTAClick: () => void }) => React.ReactNode;
};

type BannerCarouselProps = {
    banners: CarouselBanner[];
    onClose: (key: string) => void;
    onCTAClick: (key: string) => void;
};

export const BannerCarousel = ({ banners, onClose, onCTAClick }: BannerCarouselProps) => {
    const [activeKey, setActiveKey] = useState(banners[0]?.key);
    const previousIndexRef = useRef(0);
    const [direction, setDirection] = useState(1);

    const activeIndex = banners.findIndex(banner => banner.key === activeKey);
    const safeActiveIndex = activeIndex === -1 ? 0 : activeIndex;
    const activeBanner = banners[safeActiveIndex];

    useEffect(() => {
        if (!banners.some(banner => banner.key === activeKey)) {
            setDirection(1);
            setActiveKey(banners[0]?.key);
            previousIndexRef.current = 0;
        }
    }, [banners, activeKey]);

    if (!activeBanner) {
        return null;
    }

    const handleSelect = (index: number) => {
        const target = banners[index];

        if (!target) return;

        setDirection(index > previousIndexRef.current ? 1 : -1);
        previousIndexRef.current = index;
        setActiveKey(target.key);
    };

    const handleClose = () => {
        onClose(activeBanner.key);
    };

    const handleCTAClick = () => {
        onCTAClick(activeBanner.key);
    };

    return (
        <Column alignItems="center" width="100%">
            <Box
                borderRadius={16}
                overflow="hidden"
                width="100%"
                borderWidth={1}
                backgroundColor="surfaceFillRaised"
                borderColor="surfaceBorderSunken"
            >
                <Grid columns="1fr">
                    <AnimatePresence initial={false} custom={direction}>
                        <Slide
                            key={activeBanner.key}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={slideTransition}
                        >
                            {activeBanner.render({
                                onClose: handleClose,
                                onCTAClick: handleCTAClick,
                            })}
                        </Slide>
                    </AnimatePresence>
                </Grid>
            </Box>
            {banners.length > 1 && (
                <Row margin={{ top: 10, bottom: 2 }}>
                    <CarouselIndicator
                        count={banners.length}
                        activeIndex={safeActiveIndex}
                        onSelect={handleSelect}
                    />
                </Row>
            )}
        </Column>
    );
};
