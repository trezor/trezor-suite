/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';

import t1Hologram from '../videos/T1_hologram.mp4';
import t2Hologram from '../videos/TT_hologram.mp4';

interface Props {
    model: number;
}

const Hologram = (props: Props) => {
    const sources: { [index: string]: any } = {
        1: t1Hologram,
        2: t2Hologram,
    };
    return (
        <video width="100%" autoPlay loop>
            <source src={sources[props.model]} type="video/mp4" />
        </video>
    );
};

export default Hologram;
