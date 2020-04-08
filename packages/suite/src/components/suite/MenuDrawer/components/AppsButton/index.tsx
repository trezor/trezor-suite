import React from 'react';
import styled from 'styled-components';
import { Icon, colors } from '@trezor/components';
import { Translation } from '@suite-components';

const Wrapper = styled.header`
    width: 100%;
    height: 50px;
    background-color: ${colors.WHITE};
    display: flex;
    align-items: center;
    padding: 0px 12px;
    cursor: pointer;
    &:hover {
        svg {
            fill: ${colors.BLACK17};
        }
    }
`;

const Title = styled.div`
    padding-left: 8px;
`;

export default ({ onClick }: { onClick: () => void }) => {
    return (
        <Wrapper onClick={onClick}>
            <Icon icon="ARROW_LEFT" size={14} color={colors.BLACK0} />
            <Title>
                <Translation id="TR_APPS_BUTTON" />
            </Title>
        </Wrapper>
    );
};
