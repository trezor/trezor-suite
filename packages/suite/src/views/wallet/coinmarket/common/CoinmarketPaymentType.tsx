import { ReactNode } from 'react';
import styled from 'styled-components';
import { BuyCryptoPaymentMethod, SellCryptoPaymentMethod } from 'invity-api';
import { CoinmarketPaymentPlainType } from './CoinmarketPaymentPlainType';
import invityAPI from 'src/services/suite/invityAPI';

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
    method?: BuyCryptoPaymentMethod | SellCryptoPaymentMethod;
    methodName?: string;
}

export const CoinmarketPaymentType = ({
    children,
    method,
    methodName,
}: CoinmarketPaymentTypeProps) => (
    <Wrapper>
        <>
            {method && (
                <IconWrapper>
                    <Bg>
                        <Icon width="24px" src={invityAPI.getPaymentMethodUrl(method)} />
                    </Bg>
                </IconWrapper>
            )}
            <CoinmarketPaymentPlainType method={method} methodName={methodName}>
                {children}
            </CoinmarketPaymentPlainType>
        </>
    </Wrapper>
);
