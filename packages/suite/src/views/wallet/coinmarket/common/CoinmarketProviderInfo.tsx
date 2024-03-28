import styled from 'styled-components';
import invityApi from 'src/services/suite/invityAPI';
import { spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Bg = styled.div`
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
    ${({
        theme,
    }) => `filter: drop-shadow(1px 0 0 ${theme.BG_ICON}) drop-shadow(0 1px 0 ${theme.BG_ICON}) drop-shadow(-1px 0 0 ${theme.BG_ICON})
        drop-shadow(0 -1px 0 ${theme.BG_ICON});`}
`;

const Text = styled.div`
    display: flex;
    padding-left: ${spacingsPx.xxs};
    align-items: center;
`;

interface CoinmarketProviderInfoProps {
    exchange?: string;
    providers?: {
        [name: string]: {
            logo: string;
            companyName: string;
            brandName?: string;
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
                    <Text>{provider.brandName || provider.companyName}</Text>
                </>
            )}
        </Wrapper>
    );
};
