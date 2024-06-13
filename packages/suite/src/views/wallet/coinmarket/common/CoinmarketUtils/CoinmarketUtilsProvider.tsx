import styled from 'styled-components';
import invityApi from 'src/services/suite/invityAPI';
import { Translation } from 'src/components/suite';
import { spacingsPx, typography } from '@trezor/theme';

const IconWrap = styled.div`
    display: flex;
    align-items: center;
`;
const Icon = styled.img`
    flex: none;
    width: 20px;
    border-radius: 2px;
`;

const IconText = styled.div`
    flex: auto;
    width: 100%;
    align-items: center;
    margin-left: ${spacingsPx.xs};
    ${typography.body}
    color: ${({ theme }) => theme.textDefault};
`;

interface CoinmarketUtilsProviderProps {
    exchange?: string;
    className?: string;
    providers?: {
        [name: string]: {
            logo: string;
            companyName: string;
            brandName?: string;
        };
    };
}

export const CoinmarketUtilsProvider = ({
    exchange,
    providers,
    className,
}: CoinmarketUtilsProviderProps) => {
    const provider = providers && exchange ? providers[exchange] : null;

    return (
        <IconWrap className={className}>
            {provider ? (
                <>
                    {provider.logo && (
                        <Icon
                            src={`${invityApi.getApiServerUrl()}/images/exchange/${provider.logo}`}
                        />
                    )}
                    <IconText>{provider.brandName ?? provider.companyName}</IconText>
                </>
            ) : (
                <Translation id="TR_COINMARKET_UNKNOWN_PROVIDER" />
            )}
        </IconWrap>
    );
};
