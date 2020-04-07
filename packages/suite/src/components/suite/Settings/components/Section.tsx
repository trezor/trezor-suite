import React, { ReactNode, ReactElement } from 'react';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import { variables, colors } from '@trezor/components';

const Wrapper = styled.div`
    padding: 12px;
`;

const Title = styled.div`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.BOLD};
`;

const Description = styled.div``;

const Content = styled(Card)`
    flex-direction: column;
    flex: 1;
`;

interface Props {
    children: React.ReactNode;
    customHeader?: ReactNode | ReactElement;
    title?: string | ReactElement;
    description?: string | ReactElement;
}

const Section = ({ children, title, description, customHeader }: Props) => {
    return (
        <Wrapper>
            {!title && customHeader}
            {title && !customHeader && <Title>{title}</Title>}
            {description && !customHeader && <Description>{description}</Description>}
            <Card>
                <Content>{children}</Content>
            </Card>
        </Wrapper>
    );
};

export default Section;
