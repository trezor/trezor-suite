import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { Icon, variables } from '@trezor/components';
import { useSelector } from '@suite-hooks/useSelector';
import { selectCurrentTargetAnonymity } from '@wallet-reducers/coinjoinReducer';
import { darken } from 'polished';

const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border-radius: 8px;

    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: right;

    background: ${({ theme }) => theme.STROKE_GREY};

    &:hover,
    &:focus,
    &:active {
        background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.STROKE_GREY)};
    }

    cursor: ${({ onClick }) => (onClick ? 'pointer' : 'default')};
`;

const Values = styled.div`
    min-width: 64px;
`;

const AnonymityLevel = styled.p`
    font-variant-numeric: tabular-nums;
`;

const AnonymityStatus = styled.p`
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-size: ${variables.FONT_SIZE.TINY};
`;

enum AnomymityStatus {
    Good = 'GOOD',
    Great = 'GREAT',
}

interface AnonymityLevelIndicatorProps {
    className?: string;
    onClick?: () => void;
}

export const AnonymityLevelIndicator = forwardRef<HTMLDivElement, AnonymityLevelIndicatorProps>(
    ({ className, onClick }, ref) => {
        const targetAnonymity = useSelector(selectCurrentTargetAnonymity) || 1;

        const anonymityStatus = getAnonymityStatus(targetAnonymity);

        return (
            <Container className={className} onClick={onClick} ref={ref}>
                <Icon icon="USERS" />

                <Values>
                    <AnonymityLevel>
                        <Translation
                            id="TR_COINJOIN_ANONYMITY_LEVEL_INDICATOR"
                            values={{ targetAnonymity }}
                        />
                    </AnonymityLevel>
                    <AnonymityStatus color={anonymityStatus.color}>
                        {anonymityStatus.label}
                    </AnonymityStatus>
                </Values>
            </Container>
        );
    },
);
