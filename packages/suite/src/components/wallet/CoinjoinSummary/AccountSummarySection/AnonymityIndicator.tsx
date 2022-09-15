import React from 'react';
import styled from 'styled-components';
import { Icon, variables } from '@trezor/components';

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

const UsersIcon = styled(Icon)`
    path {
        fill: none;
    }
`;

const AnonymityStatus = styled.p`
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-size: ${variables.FONT_SIZE.TINY};
`;

enum AnomymityStatus {
    Good = 'GOOD',
    Great = 'GREAT',
}

export const AnonymityIndicator = () => {
    const anomymityLevel = 10;

    return (
        <Container>
            <UsersIcon icon="USERS" />

            <div>
                <p>{`1 in ${anomymityLevel}`}</p>
                <AnonymityStatus>{AnomymityStatus.Good}</AnonymityStatus>
            </div>
        </Container>
    );
};
