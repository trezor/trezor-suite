import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { BuyProviderInfo } from 'invity-api';
import invityApi from '@suite-services/invityAPI';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    padding-left: 4px;
    padding-right: 8px;
`;

const Icon = styled.img`
    border-radius: 2px;
`;

const Text = styled.div`
    display: flex;
    padding-left: 5px;
    align-items: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Props {
    exchange?: string;
    providers?: {
        [name: string]: BuyProviderInfo;
    };
}

const CoinmarketBuyProviderInfo = ({ exchange, providers }: Props) => {
    const provider = providers && exchange ? providers[exchange] : null;

    return (
        <Wrapper>
            {!exchange && 'Unknown provider'}
            {!provider && exchange}
            {provider && (
                <>
                    <IconWrapper>
                        <Icon
                            width="16px"
                            src={`${invityApi.server}/images/exchange/${provider.logo}`}
                        />
                    </IconWrapper>
                    <Text>{provider.companyName}</Text>
                </>
            )}
        </Wrapper>
    );
};

export default CoinmarketBuyProviderInfo;
