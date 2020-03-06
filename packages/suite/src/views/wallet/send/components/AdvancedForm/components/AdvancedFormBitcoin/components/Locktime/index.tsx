import { colors, Switch, variables, Input } from '@trezor/components';
import React from 'react';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    display: flex;
    flex: 1;
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    padding-bottom: 7px;
`;

const Description = styled.div`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Left = styled.div`
    padding-right: 5px;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: flex-end;
`;

const StyledInput = styled(Input)`
    margin-top: 20px;
`;

export default () => {
    return (
        <Wrapper>
            <Row>
                <Left>
                    <Title>
                        <Translation {...messages.LOCKTIME_TITLE} />
                    </Title>
                    <Description>
                        <Translation {...messages.LOCKTIME_DESCRIPTION} />
                    </Description>
                </Left>
                <Right>
                    <Switch checked={false} onChange={() => console.log('change')} />
                </Right>
            </Row>
            <StyledInput display="block" value="" variant="small" />
        </Wrapper>
    );
};
