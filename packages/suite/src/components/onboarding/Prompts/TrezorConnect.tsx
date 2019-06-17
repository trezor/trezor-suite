/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';

import { resolveStaticPath } from '@suite-utils/nextjs';

interface Props {
    model: number;
    height: number;
    loop: boolean;
}

const TrezorConnect = ({ model, height, loop }: Props) => {
    const models = new Map([
        [1, 'videos/onboarding/trezor-click-2.mp4'],
        [2, 'videos/onboarding/trezor-click-1.mp4'],
    ]);
    return (
        <React.Fragment>
            {/* just a hack to switch loop from true to false without need to forward ref to the video */}
            {loop && (
                <video height={height} autoPlay loop={loop}>
                    <source src={resolveStaticPath(models.get(model))} type="video/mp4" />
                </video>
            )}
            {!loop && (
                <video height={height} autoPlay loop={loop}>
                    <source src={resolveStaticPath(models.get(model))} type="video/mp4" />
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
