/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';

import { resolveStaticPath } from '@suite-utils/nextjs';

interface Props {
    model: number;
}

const Hologram = (props: Props) => {
    const videos: { [index: string]: any } = {
        1: {
            src: 'T1_hologram.mp4',
            loop: true,
        },
        2: {
            src: 'TT_hologram.mov',
            loop: false,
        },
    };
    return (
        <video
            width="100%"
            autoPlay
            loop={videos[props.model].loop}
            data-test={`@onboarding/hologram/model-${props.model}-video`}
        >
            <source
                src={resolveStaticPath(`videos/onboarding/${videos[props.model].src}`)}
                type="video/mp4"
            />
        </video>
    );
};

export default Hologram;
