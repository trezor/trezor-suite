import { asNetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress } from '@suite-common/wallet-types';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TokenName } from './TokenName';

const contract = toTokenAddress('0x0000000000000000000000000000000000000001');
const networkSymbol = asNetworkSymbol('eth');
const text = 'Visit first.example or second.example';
const preloadedState = {
    tokenDefinitions: {
        pol: { coin: { data: [contract] } },
    },
};

describe('TokenName', () => {
    it('checks recognition on the selected network and keeps recognized names readable', async () => {
        const { getByLabelText, getByText, queryByLabelText, rerender } =
            await renderWithStoreProvider(
                <TokenName text={text} networkSymbol={networkSymbol} tokenContract={contract} />,
                { preloadedState },
            );

        expect(getByLabelText('Visit … or …')).toBeOnTheScreen();

        await rerender(
            <TokenName
                text={text}
                networkSymbol={asNetworkSymbol('pol')}
                tokenContract={contract}
                numberOfLines={1}
            />,
        );

        expect(getByText(text)).toHaveProp('numberOfLines', 1);
        expect(queryByLabelText('Visit … or …')).toBeNull();
    });

    it('reveals each URL independently for an unrecognized token', async () => {
        const { getByLabelText, getByText } = await renderWithStoreProvider(
            <TokenName text={text} networkSymbol={networkSymbol} tokenContract={contract} />,
            { preloadedState },
        );

        await fireEvent.press(getByText('first.example'), { stopPropagation: () => undefined });

        expect(getByLabelText('Visit first.example or …')).toBeOnTheScreen();
    });

    it('keeps an unidentified token masked', async () => {
        const { getByLabelText } = await renderWithStoreProvider(
            <TokenName text={text} networkSymbol={networkSymbol} />,
        );

        expect(getByLabelText('Visit … or …')).toBeOnTheScreen();
    });

    it('keeps the full amount private when discreet mode is forced', async () => {
        const { getByTestId, queryByLabelText } = await renderWithStoreProvider(
            <TokenName
                text="100 claim.example"
                networkSymbol={networkSymbol}
                tokenContract={contract}
                isDiscreetText
                isForcedDiscreetMode
            />,
        );

        expect(getByTestId('discreet-text')).toHaveStyle({ opacity: 0 });
        expect(queryByLabelText('100 …')).toBeNull();
    });
});
