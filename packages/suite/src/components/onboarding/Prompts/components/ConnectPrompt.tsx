/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';

import { resolveStaticPath } from '@suite-utils/nextjs';

interface Props {
    model: number;
    height: number;
    loop: boolean;
}

const TrezorConnect = ({ model, height, loop }: Props) => {
    const path = `videos/onboarding/trezor-click-${model}.mp4`;
    return (
        <React.Fragment>
            {/* just a hack to switch loop from true to false without need to forward ref to the video */}
            {loop && (
                <video height={height} autoPlay loop={loop}>
                    <source src={resolveStaticPath(path)} type="video/mp4" />
                </video>
            )}
            {!loop && (
                <video height={height} autoPlay loop={loop}>
                    <source src={resolveStaticPath(path)} type="video/mp4" />
                </video>
            )}
        </React.Fragment>
    );
};

TrezorConnect.defaultProps = {
    height: 200,
    loop: false,
};

export default TrezorConnect;
