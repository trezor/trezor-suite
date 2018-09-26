import styled from 'styled-components';
import React from 'react';
import { connect } from 'react-redux';
import Content from 'views/Wallet/components/Content';

const Wrapper = styled.div``;

const WalletSettings = () => (
    <Content>
        <Wrapper>
            Wallet settings
        </Wrapper>
    </Content>
);

export default connect(null, null)(WalletSettings);
