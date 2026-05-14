import { type AccountKey } from '@suite-common/wallet-types';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { useUtxoSelection } from '../../../hooks/useUtxoSelection';
import { SendUtxoScreenHeader } from '../SendUtxoScreenHeader';

jest.mock('../../../hooks/useUtxoSelection', () => ({
    useUtxoSelection: jest.fn(),
}));

describe('SendUtxosScreenHeader', () => {
    it('should render delete button when there are selected utxos', () => {
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

        const { getByTestId } = renderWithBasicProvider(
            <SendUtxoScreenHeader
                accountKey={
                    'testAccKey' as AccountKey // Todo: create properly via `createAccountKey()`
                }
            />,
        );

        expect(getByTestId('coin-control-delete-button')).toBeTruthy();
    });

    it('should not render delete button when there are no selected utxos', () => {
        (useUtxoSelection as jest.Mock).mockReturnValue({
            selectedUtxos: [],
            setSelectedUtxos: jest.fn(),
        });

        const { queryByTestId } = renderWithBasicProvider(
            <SendUtxoScreenHeader
                accountKey={
                    'testAccKey' as AccountKey // Todo: create properly via `createAccountKey()`
                }
            />,
        );

        expect(queryByTestId('coin-control-delete-button')).toBeNull();
    });
});
