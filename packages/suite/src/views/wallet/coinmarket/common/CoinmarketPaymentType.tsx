import { ReactNode } from 'react';
import styled from 'styled-components';
import invityApi from 'src/services/suite/invityAPI';
import { BuyCryptoPaymentMethod, SavingsPaymentMethod, SellCryptoPaymentMethod } from 'invity-api';
import { CoinmarketPaymentPlainType } from './CoinmarketPaymentPlainType';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Bg = styled.div`
    background: ${({ theme }) => theme.BG_ICON};
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

interface CoinmarketPaymentTypeProps {
    children?: ReactNode;
    method?: BuyCryptoPaymentMethod | SellCryptoPaymentMethod | SavingsPaymentMethod;
    methodName?: string;
}

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
            <CoinmarketPaymentPlainType method={method} methodName={methodName}>
                {children}
            </CoinmarketPaymentPlainType>
        </>
    </Wrapper>
);
