import { Translation } from '@suite-components/Translation';
import { colors, Input, Switch, Tooltip, variables } from '@trezor/components';
import React from 'react';
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
                        <Translation id="LOCKTIME_TITLE" />
                    </Title>
                    <Description>
                        <Translation id="LOCKTIME_DESCRIPTION" />
                    </Description>
                </Left>
                <Right>
                    <Tooltip placement="top" content={<Translation id="TR_SEND_COMING_SOON" />}>
                        <Switch checked={false} onChange={() => console.log('change')} />
                    </Tooltip>
                </Right>
            </Row>
            <StyledInput
                isDisabled
                value=""
                variant="small"
                onChange={() => console.log('change')}
            />
        </Wrapper>
    );
};
