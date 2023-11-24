import { ReactNode } from 'react';
import styled from 'styled-components';
import { H3, P, variables } from '@trezor/components';
import { CircleBorder } from 'src/components/suite';

const StyledH3 = styled(H3)<{ size?: string }>`
    margin-top: 18px;
    font-size: ${({ size }) => size === 'small' && variables.FONT_SIZE.NORMAL};
`;

const StyledP = styled(P)`
    margin-top: 8px;
`;

const GreyP = styled(StyledP)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

interface StakingFeatureProps {
    icon: ReactNode;
    title: ReactNode;
    titleSize?: 'small' | 'normal';
    description: ReactNode;
    extraDescription?: ReactNode;
}

export const StakingFeature = ({
    icon,
    title,
    titleSize = 'normal',
    description,
    extraDescription,
}: StakingFeatureProps) => (
    <div>
        <CircleBorder>{icon}</CircleBorder>

        <StyledH3 size={titleSize}>{title}</StyledH3>

        <GreyP size="small" weight="medium">
            {description}
        </GreyP>

        <StyledP size="tiny" weight="medium">
            {extraDescription}
        </StyledP>
    </div>
);
