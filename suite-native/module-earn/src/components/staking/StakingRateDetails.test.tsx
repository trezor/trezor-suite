import { type Text as NativeTextComponent } from 'react-native';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type BottomSheetModalProps, Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { StakingRateDetails } from './StakingRateDetails';

const mockOpenModal = jest.fn();

jest.mock('@suite-native/assets', () => ({
    ...jest.requireActual('@suite-native/assets'),
    AssetSymbol: () => null,
}));

jest.mock('@suite-native/icons', () => ({
    ...jest.requireActual('@suite-native/icons'),
    TokenIcon: () => null,
}));

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetModal: () => ({
        bottomSheetRef: { current: null },
        openModal: mockOpenModal,
        closeModal: jest.fn(),
    }),
    BottomSheetModal: ({ children, title }: BottomSheetModalProps) => {
        const { Text: NativeText } = jest.requireActual<{ Text: typeof NativeTextComponent }>(
            'react-native',
        );

        return (
            <>
                <NativeText>{title}</NativeText>
                {children}
            </>
        );
    },
}));

describe('StakingRateDetails', () => {
    beforeEach(() => {
        mockOpenModal.mockClear();
    });

    it.each([
        {
            symbol: 'eth',
            rateKind: 'apy',
            title: 'earn.stakingRate.apyTitle',
            description: 'earn.stakingRate.apyDescription',
        },
        {
            symbol: 'trx',
            rateKind: 'apr',
            title: 'earn.stakingRate.aprTitle',
            description: 'earn.stakingRate.aprDescription',
        },
    ] as const)(
        'requests opening the $rateKind explanation on press',
        async ({ symbol, rateKind, title, description }) => {
            const view = await renderWithBasicProvider(
                <StakingRateDetails
                    networkSymbol={asNetworkSymbol(symbol)}
                    rate={2.94}
                    rateKind={rateKind}
                >
                    <Text>~2.94%</Text>
                </StakingRateDetails>,
            );

            expect(mockOpenModal).not.toHaveBeenCalled();
            await fireEvent.press(view.getByRole('button', { name: '~2.94%' }));
            expect(mockOpenModal).toHaveBeenCalledTimes(1);
            expect(view.getByText(getTranslation(title))).toBeOnTheScreen();
            expect(view.getByText(getTranslation(description))).toBeOnTheScreen();
        },
    );

    it('leaves a zero rate as plain text', async () => {
        const view = await renderWithBasicProvider(
            <StakingRateDetails networkSymbol={asNetworkSymbol('ada')} rate={0} rateKind="apy">
                <Text>0% APY</Text>
            </StakingRateDetails>,
        );

        expect(view.getByText('0% APY')).toBeOnTheScreen();
        expect(view.queryByRole('button')).toBeNull();
    });
});
