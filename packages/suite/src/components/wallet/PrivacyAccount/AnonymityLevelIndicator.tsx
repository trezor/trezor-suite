import React, { forwardRef } from 'react';
import styled, { DefaultTheme } from 'styled-components';
import { Icon, variables, useTheme } from '@trezor/components';
import { Translation } from '@suite-components';
import { useAnonymityStatus } from '@suite-hooks';
import { darken } from 'polished';
import { AnonymityStatus } from '@suite-constants/coinjoin';

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

interface GetAnonymityStatusColorProps {
    theme: DefaultTheme;
    anonymityStatus: AnonymityStatus;
}

const getAnonymityStatusColor = ({ theme, anonymityStatus }: GetAnonymityStatusColorProps) => {
    switch (anonymityStatus) {
        case AnonymityStatus.Bad:
            return theme.TYPE_RED;
        case AnonymityStatus.Medium:
            return theme.TYPE_DARK_ORANGE;
        default:
            return theme.TYPE_GREEN;
    }
};

const AnonymityStatusLabel = styled.p<{ color: string }>`
    color: ${({ color }) => color};
    font-size: ${variables.FONT_SIZE.TINY};
`;

interface AnonymityStatusLabelValueProps {
    anonymityStatus: AnonymityStatus;
}

const AnonymityStatusLabelValue = ({ anonymityStatus }: AnonymityStatusLabelValueProps) => {
    switch (anonymityStatus) {
        case AnonymityStatus.Bad:
            return <Translation id="TR_ANONYMITY_LEVEL_BAD" />;
        case AnonymityStatus.Medium:
            return <Translation id="TR_ANONYMITY_LEVEL_MEDIUM" />;
        case AnonymityStatus.Good:
            return <Translation id="TR_ANONYMITY_LEVEL_GOOD" />;
        case AnonymityStatus.Great:
            return <Translation id="TR_ANONYMITY_LEVEL_GREAT" />;
        default:
            return null;
    }
};

interface AnonymityLevelIndicatorProps {
    className?: string;
    onClick?: () => void;
}

export const AnonymityLevelIndicator = forwardRef<HTMLDivElement, AnonymityLevelIndicatorProps>(
    ({ className, onClick }, ref) => {
        const { anonymityStatus, targetAnonymity } = useAnonymityStatus();
        const theme = useTheme();

        return (
            <Container className={className} onClick={onClick} ref={ref}>
                <Icon icon="USERS" />

                <Values>
                    <AnonymityLevel>
                        <Translation
                            id="TR_COINJOIN_ANONYMITY_LEVEL_INDICATOR"
                            values={{ anonymity: targetAnonymity }}
                        />
                    </AnonymityLevel>
                    <AnonymityStatusLabel
                        color={getAnonymityStatusColor({ theme, anonymityStatus })}
                    >
                        <AnonymityStatusLabelValue anonymityStatus={anonymityStatus} />
                    </AnonymityStatusLabel>
                </Values>
            </Container>
        );
    },
);
