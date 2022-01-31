import React, { ReactNode, ReactElement } from 'react';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import { variables, P } from '@trezor/components';

const Wrapper = styled.div`
    margin-bottom: 36px;
`;

const Header = styled.div`
    padding: 4px 12px 12px 0;
    margin-bottom: 12px;
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    text-transform: uppercase;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Description = styled(P)`
    margin-top: 4px;
`;

const Content = styled(Card)`
    flex-direction: column;
`;

interface Props {
    children: React.ReactNode;
    customHeader?: ReactNode | ReactElement;
    title?: string | ReactElement;
    description?: string | ReactElement;
}

const Section = ({ children, title, description, customHeader }: Props) => (
    <Wrapper>
        <Header>
            {!title && customHeader}
            {title && !customHeader && <Title>{title}</Title>}
            {description && !customHeader && <Description size="tiny">{description}</Description>}
        </Header>
        <Content largePadding noVerticalPadding noPadding>
            {children}
        </Content>
    </Wrapper>
);

export default Section;
