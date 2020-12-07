import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import invityApi from '@suite-services/invityAPI';
import { BuyCryptoPaymentMethod } from 'invity-api';
import { Translation } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Bg = styled.div`
    background: ${props => props.theme.BG_ICON};
    display: flex;
    align-items: center;
    border-radius: 4px;
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    padding-right: 9px;
`;

const Icon = styled.img``;

const Text = styled.div`
    display: flex;
    align-items: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Props {
    method?: BuyCryptoPaymentMethod;
}

const CoinmarketPaymentType = ({ method }: Props) => {
    return (
        <Wrapper>
            {!method && (
                <Text>
                    <Translation id="TR_PAYMENT_METHOD_UNKOWN" />
                </Text>
            )}
            {method && (
                <>
                    <IconWrapper>
                        <Bg>
                            <Icon
                                width="24px"
                                src={`${invityApi.server}/images/paymentMethods/suite/${method}.svg`}
                            />
                        </Bg>
                    </IconWrapper>
                    {/* temporary solution - payment mehtod name will be returned by API server to be independent on translations */}
                    <Translation id={`TR_PAYMENT_METHOD_${method.toUpperCase()}` as any} />
                </>
            )}
        </Wrapper>
    );
};

export default CoinmarketPaymentType;
