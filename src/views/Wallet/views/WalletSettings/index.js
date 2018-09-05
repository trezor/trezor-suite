import styled from 'styled-components';
import React from 'react';
import { connect } from 'react-redux';

const Wrapper = styled.div``;

const WalletSettings = () => (
    <Wrapper>
        Wallet settings
    </Wrapper>
);

export default connect(null, null)(WalletSettings);
