import { toChecksumAddress } from '@suite-common/address';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import dump from '../../fixtures/remembered-wallet-db-lite.json';
import { expect, test } from '../../support/fixtures';
import type { IndexedDbDump } from '../../support/indexedDb';
import { createTestAnnotation } from '../../support/reporters/annotations';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const solSymbol = asNetworkSymbol('sol');

// Fresh address. A used one is rewritten to checksum with no warning.
const unusedAddress = '0x29f253e39cf5a292fb354f0ec9ed2fc14f2a3478';
const usedAddress = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
const usdtContract = toChecksumAddress('0xdac17f958d2ee523a2206206994597c13d831ec7');
// USDT associated token account of the dump's first Solana account, not the mint.
const solanaUsdtAccount = 'B9z9N352WFFzg5XXxvu7xVuXsYVhAemhsnWk9NHeD8Zk';
const solanaWalletAddress = 'ENk2eeP4umP6cjAGRsVG4NEVKEVQmRn6JEpN8hubv2Hf';

const uppercaseBech32 = 'BC1QAFK4YHQVJ4WEP57M62DGRMUTLDUSQDE8ADH20D';

test.describe('Recipient address validation', { tag: ['@noDevice'] }, () => {
    test.use({
        startEmulator: false,
        setupEmulator: false,
    });

    test.beforeEach(async ({ page, indexedDb, walletPage }) => {
        await indexedDb.waitForInit();
        await indexedDb.seedFromDump(dump as IndexedDbDump);
        await expect(page.getByTestId('@suite/loading')).toBeHidden({ timeout: 20_000 });
        await expect(page.getByTestId('@suite/bundle-loader')).toBeHidden({ timeout: 20_000 });
        await expect(walletPage.deviceDisconnectedStatus).toBeVisible({ timeout: 20_000 });
    });

    test(
        'User sees a bad Bitcoin address rejected and an uppercase address lowercased',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ walletPage, tradingPage }) => {
            await walletPage.openAccount({ symbol: btcSymbol });
            await walletPage.openSendFormButton.click();

            // Format check and wrong network share RECIPIENT_IS_NOT_VALID. There is no separate message.
            await tradingPage.sendAddressInput.fill('not-an-address');
            await expect(tradingPage.sendAddressHint).toHaveTranslation('RECIPIENT_IS_NOT_VALID');

            await tradingPage.sendAddressInput.fill(unusedAddress);
            await expect(tradingPage.sendAddressHint).toHaveTranslation('RECIPIENT_IS_NOT_VALID');

            // The lowercase notice is cleared after 3s, so assert it before the rewritten value.
            await tradingPage.sendAddressInput.fill(uppercaseBech32);
            await expect(tradingPage.sendAddressHint).toHaveTranslation(
                'TR_CONVERTED_TO_LOWERCASE',
            );
            await expect(tradingPage.sendAddressInput).toHaveValue(uppercaseBech32.toLowerCase());
        },
    );

    test(
        'User sees Ethereum checksum and contract warnings',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ walletPage, tradingPage }) => {
            await walletPage.openAccount({ symbol: ethSymbol });
            await walletPage.openSendFormButton.click();

            await test.step('Convert an unused lowercase address', async () => {
                await tradingPage.sendAddressInput.fill(unusedAddress);
                await expect(tradingPage.sendAddressHint).toContainTranslation(
                    'TR_ETH_ADDRESS_NOT_USED_NOT_CHECKSUMMED',
                );
                await expect(tradingPage.sendAddressHint.getByRole('button')).toHaveTranslation(
                    'TR_CONVERT_TO_CHECKSUM_ADDRESS',
                );

                await tradingPage.sendAddressHint.getByRole('button').click();
                await expect(tradingPage.sendAddressInput).toHaveValue(
                    toChecksumAddress(unusedAddress),
                );
            });

            await test.step('Rewrite a used lowercase address without a warning', async () => {
                await tradingPage.sendAddressInput.fill(usedAddress);
                await expect(tradingPage.sendAddressInput).toHaveValue(
                    toChecksumAddress(usedAddress),
                );
                await expect(tradingPage.sendAddressHint.getByRole('button')).toBeHidden();
            });

            await test.step('Warn when sending to a contract, then dismiss it', async () => {
                await tradingPage.sendAddressInput.fill(usdtContract);
                await expect(tradingPage.sendAddressHint).toContainTranslation(
                    'TR_EVM_ADDRESS_IS_CONTRACT',
                );
                await expect(tradingPage.sendAddressHint.getByRole('button')).toHaveTranslation(
                    'TR_I_UNDERSTAND_THE_RISK',
                );

                await tradingPage.sendAddressHint.getByRole('button').click();
                await expect(tradingPage.sendAddressHint.getByRole('button')).toBeHidden();
            });
        },
    );

    // Desktop Playwright never reports this getAccountInfo response, so the wait times out.
    test(
        'User sees a Solana token-account warning, and a wallet address stays clear',
        {
            tag: ['@webOnly'],
            annotation: createTestAnnotation({ stream: TestStream.Wallet }),
        },
        async ({ page, walletPage, tradingPage }) => {
            await walletPage.openAccount({ symbol: solSymbol });
            await walletPage.openSendFormButton.click();

            await test.step('Warn on the USDT associated token account, then dismiss it', async () => {
                await tradingPage.sendAddressInput.fill(solanaUsdtAccount);
                await expect(tradingPage.sendAddressHint).toContainTranslation(
                    'TR_SOL_ADDRESS_IS_ASSOCIATED_ACCOUNT',
                );
                await expect(tradingPage.sendAddressHint.getByRole('button')).toHaveTranslation(
                    'TR_I_UNDERSTAND_THE_RISK',
                );

                await tradingPage.sendAddressHint.getByRole('button').click();
                await expect(tradingPage.sendAddressHint.getByRole('button')).toBeHidden();
            });

            await test.step('Accept another Solana wallet from the same device', async () => {
                // Assert only after this address's account lookup returns, or the warning can still be in flight.
                const accountChecked = page.waitForResponse(response => {
                    const body = response.request().postData() ?? '';

                    return body.includes(solanaWalletAddress) && body.includes('getAccountInfo');
                });
                await tradingPage.sendAddressInput.fill(solanaWalletAddress);
                await accountChecked;
                await expect(tradingPage.sendAddressHint.getByRole('button')).toBeHidden();
            });
        },
    );
});
