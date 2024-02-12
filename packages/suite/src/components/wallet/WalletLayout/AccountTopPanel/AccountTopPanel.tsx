import styled from 'styled-components';
import { forwardRef } from 'react';

import { spacingsPx } from '@trezor/theme';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { CoinLogo, SkeletonCircle, SkeletonRectangle } from '@trezor/components';

import { FormattedCryptoAmount, AmountUnitSwitchWrapper } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { FiatHeader } from 'src/views/dashboard/components/FiatHeader';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { globalPaddingEraserStyle } from 'src/components/suite/Preloader/SuiteLayout/utils';

export const ACCOUNT_INFO_HEIGHT = 80;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxs};
    width: fit-content;
    height: ${ACCOUNT_INFO_HEIGHT}px;

    ${globalPaddingEraserStyle}
`;

const AccountCryptoBalance = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    color: ${({ theme }) => theme.textSubdued};
`;

interface AccountTopPanelSkeletonProps {
    animate?: boolean;
    symbol?: NetworkSymbol;
}

const AccountTopPanelSkeleton = ({ animate, symbol }: AccountTopPanelSkeletonProps) => (
    <Container>
        <AccountCryptoBalance>
            {symbol ? <CoinLogo size={16} symbol={symbol} /> : <SkeletonCircle size="20px" />}
            <SkeletonRectangle height={20} animate={animate} />
        </AccountCryptoBalance>

        <SkeletonRectangle width={100} height={50} animate={animate} />
    </Container>
);

export const AccountTopPanel = forwardRef<HTMLDivElement>((_, ref) => {
    const { account, loader, status } = useSelector(state => state.wallet.selectedAccount);
    const localCurrency = useSelector(selectLocalCurrency);

    // TODO: move this to FiatHeader
    const { fiatAmount } = useFiatFromCryptoValue({
        amount: account?.formattedBalance || '',
        symbol: account?.symbol || '',
    });

    if (status !== 'loaded' || !account) {
        return (
            <AccountTopPanelSkeleton
                animate={loader === 'account-loading'}
                symbol={account?.symbol}
            />
        );
    }

    const { symbol, formattedBalance } = account;

    return (
        <Container ref={ref}>
            <AmountUnitSwitchWrapper symbol={symbol}>
                <AccountCryptoBalance>
                    <CoinLogo size={16} symbol={symbol} />

                    <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />
                </AccountCryptoBalance>
            </AmountUnitSwitchWrapper>

            <FiatHeader size="large" localCurrency={localCurrency} fiatAmount={fiatAmount ?? '0'} />
        </Container>
    );
});
