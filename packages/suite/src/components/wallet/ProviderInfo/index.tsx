import React from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { useSelector } from '@suite-hooks';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Icon = styled.img``;

const Text = styled.div`
    display: flex;
    padding-left: 5px;
    align-items: center;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Props {
    exchange?: string;
}

export default ({ exchange }: Props) => {
    const providers = useSelector(state => state.wallet.coinmarket.buy.buyInfo?.providerInfos);
    const provider = providers && exchange ? providers[exchange] : null;

    return (
        <Wrapper>
            {!exchange && 'Unknown provider'}
            {!provider && exchange}
            {provider && (
                <>
                    <Icon
                        width="16px"
                        src={`https://exchange.invity.io/images/exchange/${provider.logo}`}
                    />
                    <Text>{provider.companyName}</Text>
                </>
            )}
        </Wrapper>
    );
};
