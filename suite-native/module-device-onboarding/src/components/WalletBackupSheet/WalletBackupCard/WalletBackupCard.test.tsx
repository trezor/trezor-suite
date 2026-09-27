import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { WalletBackupCard } from './WalletBackupCard';

const mockOpenLink = jest.fn();

jest.mock('@suite-native/link', () => ({ useOpenLink: () => mockOpenLink }));

describe('WalletBackupCard selection', () => {
    it('keeps the learning link separate from the accessible radio row', async () => {
        const setSelectedType = jest.fn();
        const { getByRole, getAllByRole, getByText } = await renderWithBasicProvider(
            <WalletBackupCard
                type="shamir-advanced"
                isSelected={false}
                isVisible
                setSelectedType={setSelectedType}
            />,
        );

        expect(getAllByRole('radio')).toHaveLength(1);
        const row = getByRole('radio', { checked: false });
        await fireEvent.press(row);
        expect(setSelectedType).toHaveBeenCalledTimes(1);
        expect(setSelectedType).toHaveBeenCalledWith('shamir-advanced');

        await fireEvent.press(
            getByText(
                getTranslation(
                    'moduleDeviceOnboarding.walletBackupSheet.options.shamir-advanced.alertButtonLabel',
                ),
            ),
        );

        expect(mockOpenLink).toHaveBeenCalledTimes(1);
        expect(setSelectedType).toHaveBeenCalledTimes(1);
    });
});
