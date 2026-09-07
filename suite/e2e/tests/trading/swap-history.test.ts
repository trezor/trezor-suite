import { messages } from '@suite/intl';
import { cryptoIdToNetworkSymbol } from '@suite-common/trading';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { localizeNumber } from '@suite-common/wallet-utils';
import { TestStream } from '@trezor/e2e-utils';
import { BigNumber } from '@trezor/utils';

import { tradeEndpoint } from '../../fixtures/trading';
import { PENDING_TRADE, SEEDED_TRADES } from '../../fixtures/trading/swap/swap-history';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const listStatusTranslationKeys = {
    SUCCESS: 'TR_EXCHANGE_STATUS_SUCCESS',
    ERROR: 'TR_EXCHANGE_STATUS_ERROR',
    CONFIRMING: 'TR_EXCHANGE_STATUS_CONFIRMING',
} as const;

const formatTradeDate = (date: string) =>
    new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(new Date(date));

// Trade history amounts are compact: two decimals from 1 upwards, up to five below, truncated.
const toCompactAmount = (value: string) => {
    const amount = new BigNumber(value);
    const isBelowOne = amount.abs().isLessThan(1);

    return localizeNumber(
        amount.decimalPlaces(isBelowOne ? 5 : 2, BigNumber.ROUND_DOWN),
        'en-US',
        isBelowOne ? 0 : 2,
        isBelowOne ? 5 : 2,
    );
};

test.describe('Trading - Swap history', { tag: ['@webOnly', '@T3T1', '@T3W1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic' } });

    test.beforeEach(async ({ page, onboardingPage, settingsPage, tradingStore }) => {
        // The app periodically calls `/exchange/watch/*` to refresh trade status.
        // For this test we keep status stable by echoing the current status from
        // the request body, so seeded `CONFIRMING` remains `Pending` in UI.
        await page.route(tradeEndpoint.swapWatch, async route => {
            const body = route.request().postDataJSON() as { status?: string } | null;
            await route.fulfill({ json: { status: body?.status ?? 'SUCCESS' } });
        });

        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc', 'eth', 'ltc'] });
        await tradingStore.insertSwapHistory(SEEDED_TRADES);
    });

    test(
        'View swap order history details',
        { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
        async ({ walletPage, tradingPage }) => {
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
                const expectedDates = [...SEEDED_TRADES]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(trade => formatTradeDate(trade.date));

                await expect(tradingPage.transactions.rowDates).toHaveText(expectedDates);
            });

            await test.step('Verify trade appears in history list', async () => {
                for (const trade of SEEDED_TRADES) {
                    type StatusKey = keyof typeof listStatusTranslationKeys;
                    const row = tradingPage.transactions.transactionRow(trade.orderId);
                    const receiveSymbol = (
                        cryptoIdToNetworkSymbol(
                            trade.data.receive as Parameters<typeof cryptoIdToNetworkSymbol>[0],
                        ) ?? trade.data.receive
                    ).toUpperCase();

                    await expect(row.root).toBeVisible();
                    await expect
                        .soft(row.status)
                        .toHaveAttribute(
                            'aria-label',
                            messages[listStatusTranslationKeys[trade.data.status as StatusKey]]
                                .defaultMessage,
                        );
                    await expect
                        .soft(row.sendAmount)
                        .toHaveText(
                            `${toCompactAmount(trade.data.sendStringAmount)} ${trade.sendSymbol.toUpperCase()}`,
                        );
                    await expect
                        .soft(row.receiveAmount)
                        .toHaveText(
                            `${toCompactAmount(trade.data.receiveStringAmount)} ${receiveSymbol}`,
                        );
                }
            });

            await test.step('Filter the history by trade type', async () => {
                await tradingPage.transactions.tab('sell').click();
                await expect(tradingPage.transactions.rows).toHaveCount(0);
                await expect(tradingPage.transactions.typeEmptyState).toContainTranslation(
                    'TR_TRADING_TRADE_HISTORY_NO_SELLS',
                );
                await tradingPage.transactions.showAllTradesButton.click();
                await expect(tradingPage.transactions.rows).toHaveCount(SEEDED_TRADES.length);
                await tradingPage.transactions.tab('exchange').click();
                await expect(tradingPage.transactions.rows).toHaveCount(SEEDED_TRADES.length);
                await tradingPage.transactions.tab('all').click();
            });

            const detailStatusTranslationKeys = {
                SUCCESS: 'TR_EXCHANGE_DETAIL_COMPLETE_TITLE',
                ERROR: 'TR_EXCHANGE_DETAIL_RETURNED_TITLE',
                CONFIRMING: 'TR_TRADING_DETAIL_SENDING_TRANSACTION',
            } as const;

            for (const trade of SEEDED_TRADES) {
                const receiveSymbol = (
                    cryptoIdToNetworkSymbol(
                        trade.data.receive as Parameters<typeof cryptoIdToNetworkSymbol>[0],
                    ) ?? trade.data.receive
                ).toUpperCase();

                await test.step(`Open detail for trade ${trade.orderId}`, async () => {
                    await tradingPage.transactions.transactionRow(trade.orderId).root.click();
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

                    await expect.soft(tradingPage.transactionDetailSidebar.provider).toBeVisible();
                    await expect
                        .soft(tradingPage.transactionDetailSidebar.provider)
                        .toHaveText(trade.data.exchange, { ignoreCase: true });

                    await expect
                        .soft(tradingPage.transactionDetailSidebar.orderId)
                        .toHaveText(`${trade.orderId.slice(0, 8)}...${trade.orderId.slice(-8)}`);

                    await expect(tradingPage.transactionDetailSidebar.sendAccount).toContainText(
                        getNetwork(trade.sendSymbol as NetworkSymbol).name,
                    );
                    await expect(tradingPage.transactionDetailSidebar.receiveAccount).toBeVisible();
                });

                await test.step(`Navigate back to transaction list`, async () => {
                    await tradingPage.backButton.click();
                    await expect(tradingPage.transactions.heading).toBeVisible();
                });
            }
        },
    );

    test(
        'Ongoing swap detail shows the processing header',
        { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
        async ({ walletPage, tradingPage }) => {
            await test.step('Navigate to swap/exchange trading section', async () => {
                await walletPage.openSwapTrading({ symbol: 'btc' });
            });

            await test.step('Open trading transactions history', async () => {
                await tradingPage.transactions.menuButton.click();
                await expect(tradingPage.transactions.heading).toHaveTranslation(
                    'TR_TRADING_LAST_TRANSACTIONS',
                );
            });

            await test.step('Open detail for the ongoing (CONFIRMING) trade', async () => {
                await tradingPage.transactions.transactionRow(PENDING_TRADE.orderId).root.click();
                await expect(tradingPage.transactionDetail).toBeVisible();
            });

            await test.step('Verify the processing header is shown', async () => {
                await expect(tradingPage.transactionDetailHeader).toHaveTranslation(
                    'TR_TRADING_HEADER_PROCESSING_TITLE',
                    { values: { type: 'swap' } },
                );
            });
        },
    );
});
