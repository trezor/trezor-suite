import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import React from 'react';
import styled from 'styled-components';

import AdvancedFormBitcoin from './components/AdvancedFormBitcoin';
import AdvancedFormEthereum from './components/AdvancedFormEthereum';
import AdvancedFormRipple from './components/AdvancedFormRipple';
import ButtonToggleAdditional from './components/ButtonToggleAdditional';

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
                    <ButtonToggleAdditional />
                    {/* <Add addOutput={addOutput} networkType={networkType} /> */}
                </Header>
                {advancedForm && networkType === 'bitcoin' && <AdvancedFormBitcoin />}
                {advancedForm && networkType === 'ethereum' && <AdvancedFormEthereum />}
                {advancedForm && networkType === 'ripple' && <AdvancedFormRipple />}
            </Row>
        </Wrapper>
    );
};
