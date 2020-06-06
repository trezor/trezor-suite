import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import React from 'react';
import styled from 'styled-components';

import Add from '../Add';
import Bitcoin from './components/Bitcoin';
import ToggleButton from './components/ToggleButton';
import Ethereum from './components/Ethereum';
import Ripple from './components/Ripple';

const Row = styled.div`
    display: flex;
    flex-direction: ${(props: { isColumn?: boolean }) => (props.isColumn ? 'column' : 'row')};
    padding: 0 0 30px 0;

    &:last-child {
        padding: 0;
    }
`;

const Wrapper = styled.div`
    margin-top: 20px;
`;

const Header = styled.div`
    padding: 5px 12px;
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
`;

export default () => {
    const { advancedForm, account } = useSendContext();
    const { networkType } = account;

    return (
        <Wrapper>
            <Row isColumn={advancedForm}>
                <Header>
                    <ToggleButton />
                    {networkType === 'bitcoin' && <Add />}
                </Header>
                {advancedForm && networkType === 'bitcoin' && <Bitcoin />}
                {advancedForm && networkType === 'ethereum' && <Ethereum />}
                {advancedForm && networkType === 'ripple' && <Ripple />}
            </Row>
        </Wrapper>
    );
};
