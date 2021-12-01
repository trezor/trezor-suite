import React from 'react';
import { Icon } from '@trezor/components';
import { Translation } from '@suite-components';
import TrezorLink from '@suite-components/TrezorLink';
import { transparentize } from 'polished';
import { useGuideOpenNode } from '@guide-hooks';
import { useLayoutSize } from '@suite-hooks';
import styled from 'styled-components';

const OpenGuideLink = styled(TrezorLink)`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const StyledText = styled.span`
    color: ${props => props.theme.TYPE_ORANGE};
    font-weight: 500;
    overflow: hidden;
    max-width: 0;
    transition: max-width 0.3s;
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
    dataTest?: string;
};

const OpenGuideFromTooltip = ({ id, dataTest }: OpenGuideFromTooltipProps) => {
    const { openNodeById } = useGuideOpenNode();
    const { isMobileLayout } = useLayoutSize();
    return (
        <OpenGuideLink
            data-test={dataTest}
            onClick={(e: React.MouseEvent<any>) => {
                e.stopPropagation();
                if (!isMobileLayout) openNodeById(id);
            }}
        >
            <StyledText>
                <Translation id="TR_LEARN" />
            </StyledText>
            <StyledIconWrap>
                <Icon size={12} color="#c19009" icon="LIGHTBULB" />
            </StyledIconWrap>
        </OpenGuideLink>
    );
};
export default OpenGuideFromTooltip;
