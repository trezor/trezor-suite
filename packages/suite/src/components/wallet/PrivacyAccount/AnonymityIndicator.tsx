import React from 'react';
import styled from 'styled-components';
import { Icon, variables } from '@trezor/components';
import { useSelector } from '@suite-hooks/useSelector';
import { selectCurrentTargetAnonymity } from '@wallet-reducers/coinjoinReducer';

const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 104px;
    height: 44px;
    padding: 6px 10px;
    border-radius: 8px;
    background: ${({ theme }) => theme.STROKE_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: right;
`;

const AnonymityStatus = styled.p`
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-size: ${variables.FONT_SIZE.TINY};
`;

enum AnomymityStatus {
    Good = 'GOOD',
    Great = 'GREAT',
}

interface AnonymityIndicatorProps {
    className?: string;
}

export const AnonymityIndicator = ({ className }: AnonymityIndicatorProps) => {
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity);

    return (
        <Container className={className}>
            <Icon icon="USERS" />

            <div>
                <p>{`1 in ${targetAnonymity}`}</p>
                <AnonymityStatus>{AnomymityStatus.Good}</AnonymityStatus>
            </div>
        </Container>
    );
};
