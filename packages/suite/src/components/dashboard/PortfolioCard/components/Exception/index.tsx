import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { colors, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    padding: 54px 42px;
    align-items: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
`;

const Title = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.H2};
    color: ${colors.BLACK0};
    margin-bottom: 30px;
    text-align: center;
`;

const Image = styled.img`
    display: flex;
    width: 220px;
    height: 180px;
    margin-right: 52px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        margin-bottom: 20px;
    }
`;

type Props = React.HTMLAttributes<HTMLDivElement>;

const Exception = (props: Props) => {
    return (
        <Wrapper {...props}>
            <Image src={resolveStaticPath(`images/dashboard/empty-dashboard.svg`)} />
            <Content>
                <Title>Exception page</Title>
            </Content>
        </Wrapper>
    );
};

export default Exception;
