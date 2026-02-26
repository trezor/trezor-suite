import { messages } from '@suite/intl';
import { cryptoIdToSymbol } from '@suite-common/trading';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { localizeNumber } from '@suite-common/wallet-utils';

import { invityEndpoint } from '../../fixtures/invity';
import { SEEDED_TRADES } from '../../fixtures/invity/swap/swap-history';
import { expect, test } from '../../support/fixtures';

test.describe('Trading - Swap history', { tag: ['@webOnly', '@T3T1', '@T3W1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic' } });

    test.beforeEach(async ({ page, onboardingPage, settingsPage, tradingStore }) => {
        // The app periodically calls `/exchange/watch/*` to refresh trade status.
        // For this test we keep status stable by echoing the current status from
        // the request body, so seeded `CONFIRMING` remains `Pending` in UI.
        await page.route(invityEndpoint.swapWatch, async route => {
            const body = route.request().postDataJSON() as { status?: string } | null;
            await route.fulfill({ json: { status: body?.status ?? 'SUCCESS' } });
        });

        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['ltc'] });
        await tradingStore.insertSwapHistory(SEEDED_TRADES);
    });

    test('View swap order history details', async ({ walletPage, tradingPage }) => {
        await test.step('Navigate to swap/exchange trading section', async () => {
            await walletPage.openSwapTrading({ symbol: 'btc' });
        });

        await test.step('Open trading transactions history', async () => {
            await tradingPage.transactions.menuButton.click();

            await expect(tradingPage.transactions.heading).toHaveTranslation(
                'TR_TRADING_LAST_TRANSACTIONS',
            );
        });

        await test.step('Verify trades are ordered by date descending', async () => {
            const expectedOrderedIds = [...SEEDED_TRADES]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(t => t.orderId);

            await expect(tradingPage.transactions.allSwapRows).toHaveCount(
                expectedOrderedIds.length,
            );

            for (const [index, orderId] of expectedOrderedIds.entries()) {
                await expect(tradingPage.transactions.swapRowAt(index)).toHaveAttribute(
                    'data-testid',
                    `@trading/transactions/list/swap-transaction/${orderId}`,
                );
            }
        });

        await test.step('Verify trade appears in history list', async () => {
            const statusTranslationKeys = {
                SUCCESS: 'TR_EXCHANGE_STATUS_SUCCESS',
                ERROR: 'TR_EXCHANGE_STATUS_ERROR',
                CONFIRMING: 'TR_EXCHANGE_STATUS_CONFIRMING',
            } as const;

            await expect(tradingPage.transactions.count).toHaveTranslation(
                'TR_TRADING_SWAP_COUNTER',
                { values: { totalSwaps: SEEDED_TRADES.length } },
            );

            for (const trade of SEEDED_TRADES) {
                type StatusKey = keyof typeof statusTranslationKeys;
                const row = tradingPage.transactions.swapTransactionRow(trade.orderId);
                const receiveSymbol = (
                    cryptoIdToSymbol(
                        trade.data.receive as Parameters<typeof cryptoIdToSymbol>[0],
                    ) ?? trade.data.receive
                ).toUpperCase();

                await expect(row.root).toBeVisible();
                await expect.soft(row.provider).toHaveText(trade.data.exchange, {
                    ignoreCase: true,
                });
                await expect
                    .soft(row.orderId)
                    .toHaveText(
                        `${messages['TR_TRADING_TRANS_ID'].defaultMessage} ${trade.orderId}`,
                    );
                await expect
                    .soft(row.status)
                    .toHaveTranslation(statusTranslationKeys[trade.data.status as StatusKey]);
                await expect
                    .soft(row.sendAmount)
                    .toHaveText(
                        `${localizeNumber(trade.data.sendStringAmount)} ${trade.sendSymbol.toUpperCase()}`,
                    );
                await expect
                    .soft(row.receiveAmount)
                    .toHaveText(
                        `${localizeNumber(trade.data.receiveStringAmount)} ${receiveSymbol}`,
                    );
                const expectedDate = new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hourCycle: 'h23',
                }).format(new Date(trade.date));
                await expect.soft(row.date).toHaveText(expectedDate);
            }
        });
        const detailStatusTranslationKeys = {
            SUCCESS: 'TR_EXCHANGE_DETAIL_SUCCESS_TITLE',
            ERROR: 'TR_EXCHANGE_DETAIL_ERROR_TITLE',
            CONFIRMING: 'TR_EXCHANGE_DETAIL_SENDING_TRANSACTION',
        } as const;

        for (const trade of SEEDED_TRADES) {
            const receiveSymbol = (
                cryptoIdToSymbol(trade.data.receive as Parameters<typeof cryptoIdToSymbol>[0]) ??
                trade.data.receive
            ).toUpperCase();

            await test.step(`Open detail for trade ${trade.orderId}`, async () => {
                await tradingPage.transactions
                    .swapTransactionRow(trade.orderId)
                    .viewDetailsButton.click();
            });

            await test.step(`Verify detail page for trade ${trade.orderId}`, async () => {
                type DetailStatusKey = keyof typeof detailStatusTranslationKeys;

                await expect(tradingPage.transactionDetail).toBeVisible();
                await expect
                    .soft(tradingPage.transactionDetailStatus)
                    .toHaveTranslation(
                        detailStatusTranslationKeys[trade.data.status as DetailStatusKey],
                    );

                await expect
                    .soft(tradingPage.transactionDetailSidebar.sendAmount)
                    .toHaveText(
                        `${localizeNumber(trade.data.sendStringAmount)} ${trade.sendSymbol.toUpperCase()}`,
                    );
                await expect
                    .soft(tradingPage.transactionDetailSidebar.receiveAmount)
                    .toHaveText(
                        `${localizeNumber(trade.data.receiveStringAmount)} ${receiveSymbol}`,
                    );

                await expect
                    .soft(tradingPage.transactionDetailSidebar.providerInStatusCard)
                    .toBeVisible();
                await expect
                    .soft(tradingPage.transactionDetailSidebar.providerInStatusCard)
                    .toHaveText(trade.data.exchange, { ignoreCase: true });

                await expect
                    .soft(tradingPage.transactionDetailSidebar.orderIdInStatusCard)
                    .toHaveText(trade.orderId);

                await expect(tradingPage.transactionDetailSidebar.sendAccount).toContainText(
                    getNetwork(trade.sendSymbol as NetworkSymbol).name,
                );
                await expect(tradingPage.transactionDetailSidebar.receiveAccount).toBeVisible();
            });

            await test.step(`Navigate back to transaction list`, async () => {
                await tradingPage.transactions.menuButton.click();
                await expect(tradingPage.transactions.heading).toBeVisible();
            });
        }
    });
});
