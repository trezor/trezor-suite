import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const ensName = 'vitalik.eth';
const resolvedAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

// ABI-encoded Universal Resolver responses; only the backend is mocked, not Connect or resolution.
const forwardResponse =
    '0x0000000000000000000000000000000000000000000000000000000000000040' +
    '000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045';

const reverseResponse =
    '0x0000000000000000000000000000000000000000000000000000000000000060' +
    '0000000000000000000000004976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41' +
    '000000000000000000000000a2c122be93b0074270ebee7f6b7292c7deb45047' +
    '000000000000000000000000000000000000000000000000000000000000000b' +
    '766974616c696b2e65746800000000000000000000000000000000000000000000';

test.describe('ENS in the send form', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, walletPage, blockbookMock }) => {
        await onboardingPage.completeOnboarding();
        await blockbookMock.start('eth');
        await settingsPage.changeNetworks({
            enableNetworks: [
                { symbol: 'eth', backend: { type: 'blockbook', url: blockbookMock.url } },
            ],
        });
        await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
        await walletPage.openSendFormButton.click();
    });

    test(
        'User can resolve an ENS name to a recipient address',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ tradingPage, blockbookMock }) => {
            blockbookMock.setRpcCallResponse(forwardResponse);

            await tradingPage.sendAddressInput.fill(ensName);

            await expect(tradingPage.sendAddressHint).toHaveTranslation('TR_ENS_WALLET_ADDRESS', {
                values: { address: resolvedAddress },
            });
        },
    );

    test(
        'User can see the primary ENS name of a recipient address',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ tradingPage, blockbookMock }) => {
            blockbookMock.setRpcCallResponse(reverseResponse);

            await tradingPage.sendAddressInput.fill(resolvedAddress);

            await expect(tradingPage.sendAddressHint).toHaveTranslation('TR_ENS_PRIMARY_NAME', {
                values: { name: ensName },
            });
            await expect(tradingPage.sendAddressInput).toHaveValue(resolvedAddress);
        },
    );
});
