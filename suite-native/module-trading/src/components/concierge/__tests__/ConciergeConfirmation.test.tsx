import { getTranslation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';
import { TREZOR_URL } from '@trezor/urls';

import { useConciergeProviders } from '../../../hooks/concierge/useConciergeProviders';
import { ConciergeConfirmation } from '../ConciergeConfirmation';

jest.mock('@suite-native/link', () => ({
    useOpenLink: jest.fn(),
}));

jest.mock('../../../hooks/concierge/useConciergeProviders', () => ({
    useConciergeProviders: jest.fn(),
}));

const mockUseOpenLink = useOpenLink as jest.MockedFunction<typeof useOpenLink>;
const mockUseConciergeProviders = useConciergeProviders as jest.MockedFunction<
    typeof useConciergeProviders
>;
const mockOpenLink = jest.fn();

describe('ConciergeConfirmation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseOpenLink.mockReturnValue(mockOpenLink);
    });

    it('should not render when no provider is selected', () => {
        mockUseConciergeProviders.mockReturnValue({
            selectedProvider: undefined,
        } as unknown as ReturnType<typeof useConciergeProviders>);

        const { queryByText } = renderWithBasicProvider(<ConciergeConfirmation />);

        expect(queryByText(getTranslation('generic.buttons.continue'))).toBeNull();
    });

    it('should render and open provider link on press when provider is selected', () => {
        mockUseConciergeProviders.mockReturnValue({
            selectedProvider: {
                name: 'Trezor OTC',
                url: TREZOR_URL,
                allowedCountries: ['CZ'],
            },
        } as unknown as ReturnType<typeof useConciergeProviders>);

        const { getByText } = renderWithBasicProvider(<ConciergeConfirmation />);

        const continueButton = getByText(getTranslation('generic.buttons.continue'));

        expect(continueButton).toBeOnTheScreen();

        fireEvent.press(continueButton);

        expect(mockOpenLink).toHaveBeenCalledWith(TREZOR_URL);
    });
});
