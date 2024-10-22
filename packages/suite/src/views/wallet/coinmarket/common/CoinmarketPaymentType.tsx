import { ReactNode } from 'react';
import styled from 'styled-components';
import invityAPI from 'src/services/suite/invityAPI';
import { CoinmarketPaymentPlainType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentPlainType';
import { CoinmarketPaymentMethodType } from 'src/types/coinmarket/coinmarket';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Bg = styled.div`
    background: ${({ theme }) => theme.legacy.BG_ICON};
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
    method?: CoinmarketPaymentMethodType;
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
                        <Icon width="24px" src={invityAPI.getPaymentMethodUrl(method)} alt="" />
                    </Bg>
                </IconWrapper>
            )}
            <CoinmarketPaymentPlainType method={method} methodName={methodName}>
                {children}
            </CoinmarketPaymentPlainType>
        </>
    </Wrapper>
);
