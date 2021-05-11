import { Icon, variables, useTheme } from '@trezor/components';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import SendCryptoInput from './SendCryptoInput';
import FiatInput from './FiatInput';
import ReceiveCryptoSelect from './ReceiveCryptoSelect';
import Buttons from './Buttons';
import { CRYPTO_INPUT, CRYPTO_TOKEN } from '@wallet-types/coinmarketExchangeForm';
import { useLayoutSize } from '@suite/hooks/suite';

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

const EmptyDiv = styled.div`
    width: 100%;
`;

const Inputs = () => {
    const theme = useTheme();
    const {
        trigger,
        amountLimits,
        account,
        errors,
        getValues,
    } = useCoinmarketExchangeFormContext();
    const tokenAddress = getValues(CRYPTO_TOKEN);
    const tokenData = account.tokens?.find(t => t.address === tokenAddress);
    useEffect(() => {
        trigger([CRYPTO_INPUT]);
    }, [amountLimits, trigger]);

    const { layoutSize } = useLayoutSize();
    const isXLargeLayoutSize = layoutSize === 'XLARGE';

    return (
        <Wrapper>
            <Top>
                <LeftWrapper>
                    <SendCryptoInput />
                    <Line
                        color={
                            errors.outputs &&
                            errors.outputs[0] &&
                            (errors.outputs[0].amount || errors.outputs[0].fiat)
                                ? theme.TYPE_RED
                                : theme.STROKE_GREY
                        }
                    />
                    {!tokenData && <FiatInput />}
                </LeftWrapper>
                <MiddleWrapper>
                    {!isXLargeLayoutSize && <Buttons />}
                    <StyledIcon icon="TRANSFER" size={16} />
                    {!isXLargeLayoutSize && <EmptyDiv />}
                </MiddleWrapper>
                <RightWrapper>
                    <ReceiveCryptoSelect />
                </RightWrapper>
            </Top>
            {isXLargeLayoutSize && <Buttons />}
        </Wrapper>
    );
};

export default Inputs;
