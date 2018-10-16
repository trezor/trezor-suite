import React from 'react';
import styled from 'styled-components';
import Input from 'components/inputs/Input';
import Textarea from 'components/Textarea';
import Button from 'components/Button';
import Content from 'views/Wallet/components/Content';

import { H2 } from 'components/Heading';
import colors from 'config/colors';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
    background: ${colors.WHITE};
`;

const Row = styled.div`
    padding: 10px 0 10px 0;
`;

const RowButtons = styled(Row)`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const StyledButton = styled(Button)`
    margin-left: 10px;
    width: 110px;
`;

const Column = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Sign = styled(Column)``;

const Verify = styled(Column)`
    padding-left: 20px;
`;

const Label = styled.div`
    color: ${colors.TEXT_SECONDARY};
    padding: 5px 0px 10px 0;
`;

const AccountSignVerify = () => (
    <Content>
        <H2>Sign & Verify</H2>
        <Wrapper>
            <Sign>
                <Row>
                    <Label>Address</Label>
                    <Input height={50} type="text" disabled />
                </Row>
                <Row>
                    <Label>Message</Label>
                    <Textarea rows="2" maxLength="255" />
                </Row>
                <Row>
                    <Label>Signature</Label>
                    <Textarea rows="2" maxLength="255" disabled />
                </Row>
                <RowButtons>
                    <Button isWhite>Clear</Button>
                    <StyledButton>Sign</StyledButton>
                </RowButtons>
            </Sign>
            <Verify>
                <Row>
                    <Label>Address</Label>
                    <Input type="text" />
                </Row>
                <Row>
                    <Label>Message</Label>
                    <Textarea rows="4" maxLength="255" />
                </Row>
                <Row>
                    <Label>Signature</Label>
                    <Textarea rows="4" maxLength="255" />
                </Row>
                <RowButtons>
                    <Button isWhite>Clear</Button>
                    <StyledButton>Verify</StyledButton>
                </RowButtons>
            </Verify>
        </Wrapper>
    </Content>
);

export default AccountSignVerify;