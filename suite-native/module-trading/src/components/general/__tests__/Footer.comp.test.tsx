import { PreloadedState, fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { Footer } from '../Footer';

let mockOpenLink: jest.Mock;

jest.mock('@suite-native/link', () => ({
    useOpenLink: () => mockOpenLink,
}));

describe('Footer', () => {
    const renderFooter = (preloadedState: PreloadedState) =>
        renderWithStoreProviderAsync(<Footer />, { preloadedState });

    beforeEach(() => {
        mockOpenLink = jest.fn();
    });

    it('should render footer links', async () => {
        const { getByText, getByLabelText } = await renderFooter({});

        expect(getByText('Powered by')).toBeOnTheScreen();
        expect(getByText('Learn more')).toBeOnTheScreen();
        expect(getByLabelText('Invity')).toBeOnTheScreen();
    });

    it('should render nothing when isAmountInputActive is true', async () => {
        const { toJSON } = await renderWithStoreProviderAsync(<Footer />, {
            preloadedState: {
                wallet: { tradingNew: { isAmountInputActive: true } },
            },
        });

        expect(toJSON()).toBeNull();
    });

    it('pressing links should lead to https://invity.io', async () => {
        const { getByText, getByLabelText } = await renderFooter({});

        fireEvent.press(getByLabelText('Invity'));
        fireEvent.press(getByText('Learn more'));

        expect(mockOpenLink).toHaveBeenCalledTimes(2);
        expect(mockOpenLink).toHaveBeenNthCalledWith(1, 'https://invity.io');
        expect(mockOpenLink).toHaveBeenNthCalledWith(2, 'https://invity.io');
    });
});
