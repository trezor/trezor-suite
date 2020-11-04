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

const CoinmarketPaymentType = ({ method }: Props) => (
    <Wrapper>
        {!method && (
            <Text>
                <Translation id="TR_PAYMENT_METHOD_UNKOWN" />
            </Text>
        )}
        {method && (
            <>
                <IconWrapper>
                    <Icon
                        width="24px"
                        src={`${invityApi.server}/images/paymentMethods/suite/${method}.svg`}
                    />
                </IconWrapper>
                {/* temporary solution - payment mehtod name will be returned by API server to be independent on translations */}
                <Translation id={`TR_PAYMENT_METHOD_${method.toUpperCase()}` as any} />
            </>
        )}
    </Wrapper>
);

export default CoinmarketPaymentType;
