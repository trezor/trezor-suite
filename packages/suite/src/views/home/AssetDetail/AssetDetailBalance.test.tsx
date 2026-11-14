import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { AssetDetailBalance } from './AssetDetailBalance';
import { ETH, ETH_ASSET_KEY, getEthAssetState } from './assetDetailTestState';
import { type MockSuiteState } from '../../../../mocks/mockInitialAppState';

type AssetDetailAccountsModalProps = {
    assetKey: WalletAssetKey;
    onClose: () => void;
};

jest.mock('./AssetDetailModals/AssetDetailAccountsModal', () => ({
    AssetDetailAccountsModal: ({ assetKey, onClose }: AssetDetailAccountsModalProps) => (
        <button type="button" data-testid="@asset-detail/accounts" onClick={onClose}>
            {assetKey}
        </button>
    ),
}));

const mockEthAccount = (index: number, formattedBalance: string) =>
    mockWalletAccount({
        symbol: ETH,
        index,
        descriptor: asAccountDescriptor(`0xdescriptor${index}`),
        formattedBalance,
    });

const renderBalance = (accounts: Account[]) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: getEthAssetState({ accounts, ethRate: 3000 }),
    });

    renderWithProviders(services, <AssetDetailBalance assetKey={ETH_ASSET_KEY} />);
};

describe('the balance card on the asset screen', () => {
    it('opens the accounts holding the asset from its account count', async () => {
        renderBalance([mockEthAccount(0, '1'), mockEthAccount(1, '2')]);

        expect(screen.queryByTestId('@asset-detail/accounts')).not.toBeInTheDocument();

        await userEvent.click(screen.getByTestId('@asset-detail/balance/accounts'));

        expect(screen.getByTestId('@asset-detail/accounts')).toHaveTextContent(ETH_ASSET_KEY);

        await userEvent.click(screen.getByTestId('@asset-detail/accounts'));

        expect(screen.queryByTestId('@asset-detail/accounts')).not.toBeInTheDocument();
    });
});
