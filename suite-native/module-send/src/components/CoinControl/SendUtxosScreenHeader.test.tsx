import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { SendUtxoScreenHeader } from './SendUtxoScreenHeader';
import { useUtxoSelection } from '../../hooks/useUtxoSelection';

const accountKey = mockAccountKey({ descriptor: 'testAccKey' });

jest.mock('../../hooks/useUtxoSelection', () => ({
    useUtxoSelection: jest.fn(),
}));

describe('SendUtxosScreenHeader', () => {
    it('should render delete button when there are selected utxos', async () => {
        (useUtxoSelection as jest.Mock).mockReturnValue({
            selectedUtxos: [
                {
                    txid: 'txid1',
                    vout: 0,
                    amount: '1000',
                    blockHeight: 123456,
                    address: 'address1',
                    path: 'm/44/0/0/0',
                    confirmations: 10,
                },
            ],
            setSelectedUtxos: jest.fn(),
        });

        const { getByTestId } = await renderWithBasicProvider(
            <SendUtxoScreenHeader accountKey={accountKey} />,
        );

        expect(getByTestId('coin-control-delete-button')).toBeTruthy();
    });

    it('should not render delete button when there are no selected utxos', async () => {
        (useUtxoSelection as jest.Mock).mockReturnValue({
            selectedUtxos: [],
            setSelectedUtxos: jest.fn(),
        });

        const { queryByTestId } = await renderWithBasicProvider(
            <SendUtxoScreenHeader accountKey={accountKey} />,
        );

        expect(queryByTestId('coin-control-delete-button')).toBeNull();
    });
});
