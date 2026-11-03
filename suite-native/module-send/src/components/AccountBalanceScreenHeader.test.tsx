import { asNetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { type ScreenHeaderProps } from '@suite-native/navigation';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';

import { AccountBalanceScreenHeader } from './AccountBalanceScreenHeader';

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    ScreenHeader: ({ customContent }: Pick<ScreenHeaderProps, 'customContent'>) => customContent,
}));

const symbol = asNetworkSymbol('eth');
const tokenContract = toTokenAddress('0x0000000000000000000000000000000000000001');
const tokenSymbol = 'rewards.example';
const account = mockWalletAccount({
    symbol,
    tokens: [mockAccountToken({ contract: tokenContract, symbol: tokenSymbol })],
});

describe('AccountBalanceScreenHeader', () => {
    it.each([false, true])(
        'masks a URL ticker only when it is unrecognized (recognized: %s)',
        async isRecognized => {
            await renderWithStoreProvider(
                <AccountBalanceScreenHeader
                    accountKey={account.key}
                    tokenContract={tokenContract}
                />,
                {
                    preloadedState: {
                        wallet: { accounts: [account] },
                        tokenDefinitions: {
                            [symbol]: {
                                coin: {
                                    data: isRecognized ? [tokenContract] : [],
                                    hide: [],
                                    show: [],
                                },
                            },
                        },
                    },
                },
            );

            if (isRecognized) {
                expect(
                    screen.getByText(
                        getTranslation('moduleSend.outputs.title', { assetName: tokenSymbol }),
                    ),
                ).toBeVisible();
                expect(screen.queryByLabelText('…')).toBeNull();
            } else {
                expect(screen.getByLabelText('…')).toBeOnTheScreen();
                expect(screen.queryByText(tokenSymbol)).toBeNull();
                expect(
                    screen.getByText(tokenSymbol, { includeHiddenElements: true }),
                ).toBeOnTheScreen();
            }
        },
    );
});
