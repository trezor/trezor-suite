import { Icon, variables, useTheme } from '@trezor/components';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { invityApiSymbolToSymbol } from '@wallet-utils/coinmarket/coinmarketUtils';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import SendCryptoInput from './SendCryptoInput';
import FiatInput from './FiatInput';
import ReceiveCryptoSelect from './ReceiveCryptoSelect';
import Buttons from './Buttons';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Top = styled.div`
    display: flex;
    flex: 1;

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
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

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        padding-bottom: 27px;
    }
`;

const StyledIcon = styled(Icon)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        transform: rotate(90deg);
    }
`;

const Line = styled.div<{ color: string }>`
    height: 48px;
    border: 1px solid ${props => props.color};
`;

const Inputs = () => {
    const theme = useTheme();
    const { trigger, amountLimits, token, account, errors } = useCoinmarketExchangeFormContext();
    const formattedToken = invityApiSymbolToSymbol(token);
    const tokenData = account.tokens?.find(t => t.symbol === formattedToken);
    useEffect(() => {
        trigger(['sendCryptoInput']);
    }, [amountLimits, trigger]);

    return (
        <Wrapper>
            <Top>
                <LeftWrapper>
                    <SendCryptoInput />
                    <Line
                        color={
                            errors.sendCryptoInput || errors.fiatInput
                                ? theme.TYPE_RED
                                : theme.STROKE_GREY
                        }
                    />
                    {!tokenData && <FiatInput />}
                </LeftWrapper>
                <MiddleWrapper>
                    <StyledIcon icon="TRANSFER" size={16} />
                </MiddleWrapper>
                <RightWrapper>
                    <ReceiveCryptoSelect />
                </RightWrapper>
            </Top>
            <Buttons />
        </Wrapper>
    );
};

export default Inputs;
