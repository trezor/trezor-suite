import React from 'react';
import styled from 'styled-components';
import Input from 'components/inputs/Input';
import Textarea from 'components/Textarea';
import Content from 'views/Wallet/components/Content';

import { H2 } from 'components/Heading';
import colors from 'config/colors';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
    background: ${colors.WHITE};
`;

const StyledH2 = styled(H2)`
    padding-bottom: 10px;
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
    color: ${colors.LABEL};
    padding: 5px 0px;
`;

const AccountSignVerify = () => (
    <Content>
        <Wrapper>
            <Sign>
                <StyledH2>Sign message</StyledH2>
                <Label>Message</Label>
                <Textarea rows="4" maxLength="255" />
                <Label>Address</Label>
                <Input type="text" />
                <Label>Signature</Label>
                <Textarea rows="4" maxLength="255" readOnly="readonly" />
            </Sign>
            <Verify>
                <StyledH2>Verify message</StyledH2>
                <Label>Message</Label>
                <Textarea rows="4" maxLength="255" />
                <Label>Address</Label>
                <Input type="text" />
                <Label>Signature</Label>
                <Textarea rows="4" maxLength="255" />
            </Verify>
        </Wrapper>
    </Content>
);

export default AccountSignVerify;