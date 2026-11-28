import '@suite-common/test-utils/globalOverrides';

import { type RenderResult } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenTransfer } from '@trezor/connect';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AmountComponent } from './AmountComponent';
import { mockInitialAppState } from '../../../mocks/mockInitialAppState';

const MINUS_SIGN = '–';

const tokenTransfer: TokenTransfer = {
    type: 'sent',
    standard: 'ERC20',
    contract: '0xtokencontract',
    from: '0xmyaddress',
    to: '0xrecipient',
    amount: '1500000000000000000',
    symbol: 'UNI',
    decimals: 18,
};

const renderAmount = (transfer: TokenTransfer): RenderResult => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });

    return renderWithProviders(
        services,
        <AmountComponent transfer={transfer} networkSymbol={asNetworkSymbol('eth')} withSign />,
    );
};

describe(AmountComponent.name, () => {
    it('shows a minus sign for a token sent to another address', () => {
        const { container } = renderAmount(tokenTransfer);

        expect(container).toHaveTextContent(MINUS_SIGN);
    });

    it('shows no sign for a token sent to self', () => {
        const { container } = renderAmount({ ...tokenTransfer, type: 'self', to: '0xmyaddress' });

        expect(container).toHaveTextContent('1.5');
        expect(container).not.toHaveTextContent(MINUS_SIGN);
    });
});
