/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';

import { resolveStaticPath } from '@suite-utils/nextjs';

interface Props {
    model: number;
}

const Hologram = (props: Props) => {
    const sources: { [index: string]: any } = {
        1: 'T1_hologram.mp4',
        2: 'TT_hologram.mp4',
    };
    return (
        <video width="100%" autoPlay loop>
            <source
                src={resolveStaticPath(`videos/onboarding/${sources[props.model]}`)}
                type="video/mp4"
            />
        </video>
    );
};

export default Hologram;
