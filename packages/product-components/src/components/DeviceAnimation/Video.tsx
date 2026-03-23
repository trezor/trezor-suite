import { type MouseEventHandler } from 'react';

import styled from 'styled-components';

import { resolveStaticPath } from '@trezor/env-utils';
const StyledVideo = styled.video`
    max-width: 100%;
    max-height: 100%;
`;

type VideoProps = {
    src: string;
    loop: boolean;
    autoPlay: boolean;
    videoRef: React.Ref<HTMLVideoElement>;
    onMouseOver?: MouseEventHandler<HTMLVideoElement>;
    onEnded?: () => void;
    rerenderKey: string;
};

export const Video = ({
    src,
    loop,
    videoRef,
    onMouseOver,
    rerenderKey,
    autoPlay,
    onEnded,
}: VideoProps) => {
    const commonProps = {
        loop,
        autoPlay,
        muted: true,
        ref: videoRef,
        onMouseOver,
        onEnded,
    };

    return (
        <StyledVideo key={rerenderKey} preload="auto" {...commonProps}>
            <source src={resolveStaticPath(src)} type="video/webm" />
        </StyledVideo>
    );
};
