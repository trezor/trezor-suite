import { renderWithBasicProvider } from '@suite-native/test-utils';
import { type ProviderConfirmationStatus } from '@suite-native/trading-types';

import { ProviderConfirmationStatusInfo } from '../ProviderConfirmationStatusInfo';

let mockUseProviderConfirmationStatus: ProviderConfirmationStatus;

jest.mock('../../hooks/useProviderConfirmationStatus', () => ({
    useProviderConfirmationStatus: () => mockUseProviderConfirmationStatus,
}));

describe('ProviderConfirmationStatusInfo', () => {
    const renderProviderConfirmationStatusInfo = () =>
        renderWithBasicProvider(<ProviderConfirmationStatusInfo />);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each<ProviderConfirmationStatus>(['inactive', 'confirmation_success', 'window_opened'])(
        'should render nothing when providerConfirmationStatus is [%s]',
        providerConfirmationStatus => {
            mockUseProviderConfirmationStatus = providerConfirmationStatus;

            const { toJSON } = renderProviderConfirmationStatusInfo();

            expect(toJSON()).toBeNull();
        },
    );

    it.each<[string, ProviderConfirmationStatus]>([
        ['Provider is confirming your sell', 'window_closed_incomplete'],
        ['Waiting for the provider’s receive address', 'window_closed_with_success'],
        ['Your sell couldn’t be completed', 'confirmation_failed'],
    ])(
        'should render "%s" when providerConfirmationStatus is [%s]',
        (expectedTitle, providerConfirmationStatus) => {
            mockUseProviderConfirmationStatus = providerConfirmationStatus;

            const { getByText } = renderProviderConfirmationStatusInfo();

            expect(getByText(expectedTitle)).toBeTruthy();
        },
    );
});
