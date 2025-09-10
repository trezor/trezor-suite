import { MouseEventHandler } from 'react';

import styled from 'styled-components';

import { resolveStaticPath } from '../../utils/resolveStaticPath';
const StyledVideo = styled.video`
    max-width: 100%;
    max-height: 100%;
`;

type VideoProps = {
    src: string;
    loop: boolean;
    videoRef: React.Ref<HTMLVideoElement>;
    onMouseOver?: MouseEventHandler<HTMLVideoElement>;
    onEnded?: () => void;
    rerenderKey: string;
};

export const Video = ({ src, loop, videoRef, onMouseOver, rerenderKey, onEnded }: VideoProps) => {
    const commonProps = {
        loop,
        autoPlay: true,
        muted: true,
        ref: videoRef,
        onMouseOver,
        onEnded,
    };

    return (
        <StyledVideo key={rerenderKey} {...commonProps}>
            <source src={resolveStaticPath(src)} type="video/webm" />
        </StyledVideo>
    );
};
