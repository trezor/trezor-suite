import React from 'react';
import styled from 'styled-components';
import { Icon, colors } from '@trezor/components';
import { LayoutContext } from '@suite-components';

const Wrapper = styled.header`
    width: 100%;
    height: 50px;
    box-shadow: 0 6px 14px 0 rgba(0, 0, 0, 0.1);
    background-color: ${colors.WHITE};
    display: flex;
    align-items: center;
    padding: 0px 12px;
`;

const Button = styled.div`
    padding: 12px;
    cursor: pointer;
    &:hover {
        svg {
            fill: ${colors.BLACK17};
        }
    }
`;

// padding-right => button width
const Title = styled.div`
    font-size: 20px;
    flex: 1;
    text-align: center;
    padding-right: 38px;
`;

export default ({ onClick }: { onClick: () => void }) => {
    const { title } = React.useContext(LayoutContext);
    return (
        <Wrapper>
            <Button onClick={onClick}>
                <Icon icon="MENU" size={14} color={colors.BLACK0} />
            </Button>
            <Title>{title}</Title>
        </Wrapper>
    );
};
