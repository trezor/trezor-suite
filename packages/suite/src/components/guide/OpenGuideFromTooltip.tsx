import { MouseEvent } from 'react';
import styled from 'styled-components';
import { transparentize } from 'polished';

import { Icon } from '@trezor/components';
import { Translation } from 'src/components/suite';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useGuideOpenNode } from 'src/hooks/guide';

const OpenGuideLink = styled(TrezorLink)`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const StyledText = styled.span`
    color: ${({ theme }) => theme.TYPE_ORANGE};
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
    background-color: ${({ theme }) => transparentize(0.85, theme.TYPE_ORANGE)};
`;

type OpenGuideFromTooltipProps = {
    id: string;
    instance: { hide: () => void };
    dataTest?: string;
};

export const OpenGuideFromTooltip = ({ id, instance, dataTest }: OpenGuideFromTooltipProps) => {
    const { openNodeById } = useGuideOpenNode();

    return (
        <OpenGuideLink
            data-test={dataTest}
            onClick={(e: MouseEvent<any>) => {
                e.stopPropagation();
                instance.hide();
                openNodeById(id);
            }}
            variant="nostyle"
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
