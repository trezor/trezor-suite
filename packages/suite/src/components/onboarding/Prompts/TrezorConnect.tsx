/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';

import t1video from './videos/trezor-click-1.mp4';
import t2video from './videos/trezor-click-2.mp4';

interface Props {
    model: number;
    height: number;
    loop: boolean;
}

const TrezorConnect = ({ model, height, loop }: Props) => {
    const models = new Map([[1, t1video], [2, t2video]]);
    return (
        <React.Fragment>
            {/* just a hack to switch loop from true to false without need to forward ref to the video */}
            {loop && (
                <video height={height} autoPlay loop={loop}>
                    <source src={models.get(model)} type="video/mp4" />
                </video>
            )}
            {!loop && (
                <video height={height} autoPlay loop={loop}>
                    <source src={models.get(model)} type="video/mp4" />
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
