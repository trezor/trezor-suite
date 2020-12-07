import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { BuyProviderInfo } from 'invity-api';
import invityApi from '@suite-services/invityAPI';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Bg = styled.div`
    background: ${props => props.theme.BG_ICON};
    display: flex;
    align-items: center;
    border-radius: 4px;
    padding: 4px;
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
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
                        <Bg>
                            <Icon
                                width="16px"
                                src={`${invityApi.server}/images/exchange/${provider.logo}`}
                            />
                        </Bg>
                    </IconWrapper>
                    <Text>{provider.companyName}</Text>
                </>
            )}
        </Wrapper>
    );
};

export default CoinmarketBuyProviderInfo;
