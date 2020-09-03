import React from 'react';
import styled from 'styled-components';
import { join } from 'path';
import { colors, variables } from '@trezor/components';
import invityApi from '@suite-services/invityAPI';
import { BuyCryptoPaymentMethod } from 'invity-api';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    padding-right: 8px;
`;

const Icon = styled.img``;

const Text = styled.div`
    display: flex;
    align-items: center;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Props {
    method?: BuyCryptoPaymentMethod;
}

export default ({ method }: Props) => (
    <Wrapper>
        {!method && <Text>Unknown payment method</Text>}
        {method && (
            <IconWrapper>
                <Icon
                    width="40px"
                    src={join(invityApi.server, 'images/paymentMethods', `${method}.svg`)}
                />
            </IconWrapper>
        )}
    </Wrapper>
);
