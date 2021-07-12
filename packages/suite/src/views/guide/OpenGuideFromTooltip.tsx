import React from 'react';
import styled from 'styled-components';
import { darken } from 'polished';
import { useGuide } from '@suite-hooks';
import { Translation } from '@suite-components';

const OpenGuideLink = styled.a`
    margin-left: 3px;
    color: ${props => props.theme.TYPE_GREEN};
    transition: ${props =>
        `background ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};

    &:hover {
        color: ${props => darken(props.theme.HOVER_DARKEN_FILTER, props.theme.TYPE_GREEN)};
    }
`;

type OpenGuideFromTooltipProps = {
    id: string;
};

const OpenGuideFromTooltip = ({ id }: OpenGuideFromTooltipProps) => {
    const { openNodeById } = useGuide();
    return (
        <OpenGuideLink onClick={() => openNodeById(id)}>
            <Translation id="TR_LEARN_MORE" />
        </OpenGuideLink>
    );
};

export default OpenGuideFromTooltip;
