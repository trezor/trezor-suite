import React, { useRef } from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';

const Video = styled.video`
    border-radius: 6px;
`;

interface Props {
    model: 1 | 2;
}

const HologramAnimation = (props: Props) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const videos = {
        1: {
            src: 'T1_hologram.mp4',
            loop: true,
        },
        2: {
            src: 'TT_hologram.mov',
            loop: true,
        },
    } as const;
    return (
        <Video
            ref={videoRef}
            width="100%"
            autoPlay
            onMouseOver={() => {
                // If the video is placed in tooltip it stops playing after tooltip minimizes and won't start again
                // As a quick workaround user can hover a mouse to play it again
                videoRef.current?.play();
            }}
            loop={videos[props.model].loop}
            data-test={`@onboarding/hologram/model-${props.model}-video`}
        >
            <source
                src={resolveStaticPath(`videos/onboarding/${videos[props.model].src}`)}
                type="video/mp4"
            />
        </Video>
    );
};

export default HologramAnimation;
