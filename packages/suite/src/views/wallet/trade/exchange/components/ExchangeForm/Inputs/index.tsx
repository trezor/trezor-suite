import { Icon, variables } from '@trezor/components';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { invityApiSymbolToSymbol } from '@wallet-utils/coinmarket/coinmarketUtils';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import ReceiveCryptoInput from './ReceiveCryptoInput';
import FiatInput from './FiatInput';
import SendCryptoSelect from './SendCryptoSelect';
import Buttons from './Buttons';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Top = styled.div`
    display: flex;
    flex: 1;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const LeftWrapper = styled.div`
    display: flex;
    flex: 1;
`;

const RightWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const MiddleWrapper = styled.div`
    display: flex;
    min-width: 35px;
    height: 48px;
    align-items: center;
    justify-content: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding-bottom: 27px;
    }
`;

const StyledIcon = styled(Icon)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        transform: rotate(90deg);
    }
`;

const Inputs = () => {
    const { trigger, amountLimits, token, account } = useCoinmarketExchangeFormContext();
    const formattedToken = invityApiSymbolToSymbol(token);
    const tokenData = account.tokens?.find(t => t.symbol === formattedToken);
    useEffect(() => {
        trigger(['receiveCryptoInput']);
    }, [amountLimits, trigger]);

    return (
        <Wrapper>
            <Top>
                <LeftWrapper>
                    <ReceiveCryptoInput />
                    {!tokenData && <FiatInput />}
                </LeftWrapper>
                <MiddleWrapper>
                    <StyledIcon icon="TRANSFER" size={16} />
                </MiddleWrapper>
                <RightWrapper>
                    <SendCryptoSelect />
                </RightWrapper>
            </Top>
            <Buttons />
        </Wrapper>
    );
};

export default Inputs;
