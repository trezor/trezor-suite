import { type PropsWithChildren } from 'react';

import { render, screen } from '@testing-library/react';

import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockYieldVault } from '@suite-common/wallet-core/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { YieldVaultDetailBalanceCard } from './YieldVaultDetailBalanceCard';

const mockAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
let mockVault: YieldDtoV2 = mockYieldVault();
let mockHasDepositableBalance = true;

jest.mock('./useYieldVaultDetail', () => ({
    useYieldVaultDetail: () => ({
        account: mockAccount,
        vault: mockVault,
        receiptToken: { balance: '0', symbol: 'trWETH', decimals: 18 },
        fiatAmount: null,
        hasDepositableBalance: mockHasDepositableBalance,
    }),
}));
jest.mock('./YieldVaultDetailBalanceCardActions', () => ({
    YieldVaultDetailBalanceCardActions: () => null,
}));
jest.mock('./YieldVaultDetailBalanceCardPromo', () => ({
    YieldVaultDetailBalanceCardPromo: () => <div data-testid="promo" />,
}));
jest.mock('@suite/intl', () => ({ Translation: () => null }));
jest.mock('@suite/assets', () => ({ TotalBalanceHeadline: () => null }));
jest.mock('@suite/discreet-mode', () => ({
    HiddenPlaceholder: ({ children }: PropsWithChildren) => children,
}));
jest.mock('@suite-common/formatters', () => ({
    useFormatters: () => ({ CryptoAmountFormatter: () => null }),
}));
jest.mock('@trezor/product-components', () => ({ TokenIcon: () => null }));
jest.mock('@trezor/components', () => {
    const Container = ({ children }: PropsWithChildren) => <div>{children}</div>;

    return {
        Card: Container,
        Column: Container,
        Row: Container,
        Text: Container,
        Divider: () => null,
    };
});

describe('YieldVaultDetailBalanceCard', () => {
    beforeEach(() => {
        mockVault = mockYieldVault();
        mockHasDepositableBalance = true;
    });

    it('promotes a deposit while the vault accepts deposits', () => {
        render(<YieldVaultDetailBalanceCard />);

        expect(screen.getByTestId('promo')).toBeInTheDocument();
    });

    it('hides the deposit promotion when the vault is closed to deposits', () => {
        mockVault = mockYieldVault({ status: { enter: false, exit: true } });

        render(<YieldVaultDetailBalanceCard />);

        expect(screen.queryByTestId('promo')).not.toBeInTheDocument();
    });

    it('hides the deposit promotion without anything left to deposit', () => {
        mockHasDepositableBalance = false;

        render(<YieldVaultDetailBalanceCard />);

        expect(screen.queryByTestId('promo')).not.toBeInTheDocument();
    });
});
