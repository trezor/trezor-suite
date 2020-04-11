/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';

const StyledVideo = styled.video`
    flex: 1;
`;

interface Props {
    model: number;
    height?: number;
    loop?: boolean;
}

const ConnectPrompt = ({ model, height = 200, loop = false }: Props) => {
    const path = `videos/suite/trezor-click-${model}.mp4`;
    return (
        <>
            {/* just a hack to switch loop from true to false without need to forward ref to the video */}
            {loop && (
                <StyledVideo height={height} autoPlay loop={loop}>
                    <source src={resolveStaticPath(path)} type="video/mp4" />
                </StyledVideo>
            )}
            {!loop && (
                <StyledVideo height={height} autoPlay loop={loop}>
                    <source src={resolveStaticPath(path)} type="video/mp4" />
                </StyledVideo>
            )}
        </>
    );
};

export default ConnectPrompt;
