import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
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
    padding-right: 7px;
`;

const Icon = styled.img`
    border-radius: 2px;
`;

const Text = styled.div`
    display: flex;
    padding-left: 5px;
    align-items: center;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Props {
    exchange?: string;
    providers?: {
        [name: string]: {
            logo: string;
            companyName: string;
        };
    };
}

const CoinmarketProviderInfo = ({ exchange, providers }: Props) => {
    const provider = providers && exchange ? providers[exchange] : null;
    return (
        <Wrapper>
            {!exchange && 'Unknown provider'}
            {!provider && exchange}
            {provider && (
                <>
                    {provider.logo && (
                        <IconWrapper>
                            <Bg>
                                <Icon
                                    width="16px"
                                    src={`${invityApi.getApiServerUrl()}/images/exchange/${
                                        provider.logo
                                    }`}
                                />
                            </Bg>
                        </IconWrapper>
                    )}
                    <Text>{provider.companyName}</Text>
                </>
            )}
        </Wrapper>
    );
};

export default CoinmarketProviderInfo;
