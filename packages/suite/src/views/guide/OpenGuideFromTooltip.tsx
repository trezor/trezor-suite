import React from 'react';
import styled from 'styled-components';

const OpenGuideLink = styled.a`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
`;

type OpenGuideFromTooltipProps = {
    id: string;
    openNodeById: (id: string) => void;
};

const OpenGuideFromTooltip = ({ id, openNodeById }: OpenGuideFromTooltipProps) => (
    <OpenGuideLink onClick={() => openNodeById(id)} />
);
export default OpenGuideFromTooltip;
