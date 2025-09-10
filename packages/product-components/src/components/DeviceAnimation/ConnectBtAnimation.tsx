import React, { useState } from 'react';

import { Video } from './Video';

const INTRO_SRC = 'videos/device/trezor_t3w1_connect_bt.webm';
const LOOP_SRC = 'videos/device/trezor_t3w1_connect_bt_loop.webm';

type ConnectBtAnimationProps = {
    rerenderKey: string;
    videoRef: React.Ref<HTMLVideoElement>;
    onMouseOver?: React.MouseEventHandler<HTMLVideoElement>;
};

export const ConnectBtAnimation = ({
    rerenderKey,
    videoRef,
    onMouseOver,
}: ConnectBtAnimationProps) => {
    const [showLoop, setShowLoop] = useState(false);

    const commonProps = {
        onMouseOver,
        videoRef,
    };

    return (
        <>
            {!showLoop && (
                <Video
                    {...commonProps}
                    src={INTRO_SRC}
                    loop={false}
                    rerenderKey={`${rerenderKey}_intro`}
                    onEnded={() => setShowLoop(true)}
                />
            )}

            {showLoop && (
                <Video
                    {...commonProps}
                    src={LOOP_SRC}
                    loop
                    onMouseOver={onMouseOver}
                    rerenderKey={`${rerenderKey}_loop`}
                />
            )}
        </>
    );
};
