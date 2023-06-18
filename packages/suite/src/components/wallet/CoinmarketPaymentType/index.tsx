import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import invityApi from 'src/services/suite/invityAPI';
import { BuyCryptoPaymentMethod, SavingsPaymentMethod } from 'invity-api';
import { Translation } from 'src/components/suite';

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
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface CoinmarketPaymentTypeProps {
    children?: React.ReactNode;
    method?: BuyCryptoPaymentMethod | SavingsPaymentMethod;
}

export const CoinmarketPaymentType = ({ children, method }: CoinmarketPaymentTypeProps) => (
    <Wrapper>
        {!method && (
            <Text>
                <Translation id="TR_PAYMENT_METHOD_UNKNOWN" />
            </Text>
        )}
        {method && (
            <>
                <IconWrapper>
                    <Bg>
                        <Icon
                            width="24px"
                            src={`${invityApi.getApiServerUrl()}/images/paymentMethods/suite/${method}.svg`}
                        />
                    </Bg>
                </IconWrapper>
                <div>
                    {/* temporary solution - payment method name will be returned by API server to be independent on translations */}
                    <Text>
                        <Translation id={`TR_PAYMENT_METHOD_${method.toUpperCase()}` as any} />
                    </Text>
                    {children}
                </div>
            </>
        )}
    </Wrapper>
);
