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
    key: string;
};

export const Video = ({ src, loop, videoRef, onMouseOver, key }: VideoProps) => {
    const commonProps = {
        loop,
        autoPlay: true,
        muted: true,
        ref: videoRef,
        onMouseOver,
    };

    return (
        <StyledVideo key={key} {...commonProps}>
            <source src={resolveStaticPath(src)} type="video/webm" />
        </StyledVideo>
    );
};
