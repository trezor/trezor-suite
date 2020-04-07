import React from 'react';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import { variables, colors } from '@trezor/components';

const Header = styled.div`
    color: ${colors.BLACK50};
    padding: 12px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.BOLD};
`;

const Wrapper = styled(Card)`
    flex-direction: column;
    flex: 1;
`;

interface Props {
    children: React.ReactNode;
    header?: React.ReactNode;
}

const Section = ({ children, header }: Props) => {
    return (
        <>
            {header && <Header>{header}</Header>}
            <>
                <Card>
                    <Wrapper>{children}</Wrapper>
                </Card>
            </>
        </>
    );
};

export default Section;
