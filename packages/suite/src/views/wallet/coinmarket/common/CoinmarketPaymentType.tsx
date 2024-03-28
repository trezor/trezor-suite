import { ReactNode } from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import invityApi from 'src/services/suite/invityAPI';
import { BuyCryptoPaymentMethod, SavingsPaymentMethod, SellCryptoPaymentMethod } from 'invity-api';
import { Translation } from 'src/components/suite';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Bg = styled.div`
    display: flex;
    align-items: center;
    border-radius: 4px;
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    padding-right: 9px;
`;

const Icon = styled.img`
    ${({
        theme,
    }) => `filter: drop-shadow(1px 0 0 ${theme.BG_ICON}) drop-shadow(0 1px 0 ${theme.BG_ICON}) drop-shadow(-1px 0 0 ${theme.BG_ICON})
        drop-shadow(0 -1px 0 ${theme.BG_ICON});`}
`;

const Text = styled.div`
    display: flex;
    align-items: center;
`;

interface CoinmarketPaymentTypeProps {
    children?: ReactNode;
    method?: BuyCryptoPaymentMethod | SellCryptoPaymentMethod | SavingsPaymentMethod;
    methodName?: string;
}
type TranslatedPaymentMethod = 'bankTransfer' | 'creditCard';

type PaymentMethodId = `TR_PAYMENT_METHOD_${Uppercase<TranslatedPaymentMethod>}`;

const getPaymentMethod = (method: TranslatedPaymentMethod): PaymentMethodId =>
    `TR_PAYMENT_METHOD_${method.toUpperCase() as Uppercase<TranslatedPaymentMethod>}`;

export const CoinmarketPaymentType = ({
    children,
    method,
    methodName,
}: CoinmarketPaymentTypeProps) => (
    <Wrapper>
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
                <Text>
                    {method ? (
                        <>
                            {method === 'bankTransfer' || method === 'creditCard' ? (
                                <Translation id={getPaymentMethod(method)} />
                            ) : (
                                <Text>{methodName || method}</Text>
                            )}
                        </>
                    ) : (
                        <Text>
                            <Translation id="TR_PAYMENT_METHOD_UNKNOWN" />
                        </Text>
                    )}
                </Text>
                {children}
            </div>
        </>
    </Wrapper>
);
