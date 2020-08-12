import React from 'react';
import styled from 'styled-components';
import { Icon, colors, variables } from '@trezor/components';
import { BuyCryptoPaymentMethod } from 'invity-api';
import { Translation } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    padding-right: 8px;
`;

const Text = styled.div`
    display: flex;
    align-items: center;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Props {
    method?: BuyCryptoPaymentMethod;
}

const getData = (method?: BuyCryptoPaymentMethod) => {
    switch (method) {
        case 'creditCard':
            return {
                icon: 'CREDIT_CARD',
                message: 'TR_PAYMENT_METHOD_CARD',
            } as const;
        case 'bankTransfer':
            return {
                icon: 'BANK',
                message: 'TR_PAYMENT_METHOD_BANK_TRANSFER',
            } as const;
        default:
            return null;
    }
};

export default ({ method }: Props) => {
    const data = getData(method);

    return (
        <Wrapper>
            {!method && <Text>Unknown payment method</Text>}
            {!data && method}
            {data && (
                <>
                    <IconWrapper>
                        <Icon color={colors.NEUE_TYPE_DARK_GREY} size={24} icon={data.icon} />
                    </IconWrapper>
                    <Text>
                        <Translation id={data.message} />
                    </Text>
                </>
            )}
        </Wrapper>
    );
};
