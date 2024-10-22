import { variables } from '@trezor/components';
import { borders, spacingsPx } from '@trezor/theme';
import styled from 'styled-components';

export const CoinmarketTransactionWrapper = styled.div`
    display: flex;
    margin-bottom: ${spacingsPx.lg};
    border: 1px solid ${({ theme }) => theme.borderDashed};
    border-radius: ${borders.radii.xxs};
    padding: ${spacingsPx.sm} 0;

    &:hover {
        background: ${({ theme }) => theme.legacy.BG_WHITE};
        border: 1px solid ${({ theme }) => theme.legacy.TYPE_WHITE};
        box-shadow: 0 1px 2px 0 ${({ theme }) => theme.legacy.BOX_SHADOW_BLACK_20};
    }

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        flex-wrap: wrap;
    }
`;

export const CoinmarketTransactionColumn = styled.div`
    display: flex;
    flex-direction: column;
    padding: ${spacingsPx.md} ${spacingsPx.xl};
`;

export const CoinmarketTransactionColumnDetail = styled(CoinmarketTransactionColumn)`
    flex: auto;

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        width: calc(100% - 180px);
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        width: 100%;
    }
`;

export const CoinmarketTransactionColumnProviders = styled(CoinmarketTransactionColumn)`
    width: 200px;
    flex: none;

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        width: 100%;
        order: 1;
        padding: ${spacingsPx.xxs} ${spacingsPx.xl};
    }
`;

export const CoinmarketTransactionColumnButton = styled(CoinmarketTransactionColumn)`
    align-items: flex-end;
    justify-content: center;
    width: 180px;
    flex: none;

    ${variables.SCREEN_QUERY.MOBILE} {
        width: 100%;
        order: 2;
    }
`;

interface CoinmarketTransactionContainerProps {
    TradeDetail: JSX.Element;
    TradeProviders: JSX.Element;
    TradeButton: JSX.Element;
}

export const CoinmarketTransactionContainer = ({
    TradeDetail,
    TradeProviders,
    TradeButton,
}: CoinmarketTransactionContainerProps) => (
    <CoinmarketTransactionWrapper>
        <CoinmarketTransactionColumnDetail>{TradeDetail}</CoinmarketTransactionColumnDetail>
        <CoinmarketTransactionColumnProviders>
            {TradeProviders}
        </CoinmarketTransactionColumnProviders>
        <CoinmarketTransactionColumnButton>{TradeButton}</CoinmarketTransactionColumnButton>
    </CoinmarketTransactionWrapper>
);
