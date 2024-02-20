import styled from 'styled-components';
import { variables } from '@trezor/components';
import invityApi from 'src/services/suite/invityAPI';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Bg = styled.div`
    background: ${({ theme }) => theme.BG_ICON};
    display: flex;
    align-items: center;
    border-radius: 4px;
    padding: 4px;
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Icon = styled.img`
    border-radius: 2px;
`;

const Text = styled.div`
    display: flex;
    padding-left: 9px;
    align-items: center;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface CoinmarketProviderInfoProps {
    exchange?: string;
    providers?: {
        [name: string]: {
            logo: string;
            companyName: string;
        };
    };
}

export const CoinmarketProviderInfo = ({ exchange, providers }: CoinmarketProviderInfoProps) => {
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
