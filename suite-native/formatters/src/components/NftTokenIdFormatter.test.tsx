import { type TokenSymbol } from '@suite-common/wallet-types';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { NftTokenIdFormatter, type NftTokenIdFormatterProps } from './NftTokenIdFormatter';

jest.mock('@suite-common/discreet-mode', () => ({
    useDiscreetMode: () => ({
        isDiscreetMode: false,
    }),
}));

describe('NftTokenIdFormatter', () => {
    const renderNftTokenIdFormatter = (props: Partial<NftTokenIdFormatterProps>) =>
        renderWithBasicProvider(
            <NftTokenIdFormatter tokenSymbol={'XYZ' as TokenSymbol} value="737" {...props} />,
        );

    it('should render the token ID with its symbol, not as a fungible amount', async () => {
        const { getByTestId } = await renderNftTokenIdFormatter({});

        expect(getByTestId('plain-text')).toHaveTextContent('XYZ #737');
    });

    it('should render the token ID alone when the token has no symbol', async () => {
        const { getByTestId } = await renderNftTokenIdFormatter({ tokenSymbol: null });

        expect(getByTestId('plain-text')).toHaveTextContent('#737');
    });

    it('should hide the token ID of a phishing transaction', async () => {
        const { getByTestId } = await renderNftTokenIdFormatter({ isPhishingTransaction: true });

        expect(getByTestId('discreet-text')).toHaveTextContent('XYZ #737');
    });
});
