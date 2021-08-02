import React from 'react';
import { Icon } from '@trezor/components';
import { Fade } from 'react-awesome-reveal';
import { Translation } from '@suite-components';
import { transparentize } from 'polished';
import { useGuide } from '@suite-hooks';
import styled from 'styled-components';

const OpenGuideLink = styled.a`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const StyledText = styled.span`
    display: none;
    color: ${props => props.theme.TYPE_ORANGE};
    font-weight: 500;
`;

const StyledIconWrap = styled.span`
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease-in-out;
    border-radius: 50%;
    background-color: ${props => transparentize(0.85, props.theme.TYPE_ORANGE)};
`;

type OpenGuideFromTooltipProps = {
    id: string;
};

const OpenGuideFromTooltip = ({ id }: OpenGuideFromTooltipProps) => {
    const { openNodeById } = useGuide();
    return (
        <OpenGuideLink onClick={() => openNodeById(id)}>
            <StyledText>
                <Fade direction="right" duration={300}>
                    <Translation id="TR_LEARN" />
                </Fade>
            </StyledText>
            <StyledIconWrap>
                <Icon size={12} color="#c19009" icon="LIGHTBULB" />
            </StyledIconWrap>
        </OpenGuideLink>
    );
};
export default OpenGuideFromTooltip;
