import { decodeFunctionData, parseAbi } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { Model } from '@trezor/trezor-user-env-link';

import {
    type ReviewController,
    type ReviewPage,
    assertRawReview,
    assertReviewFields,
    getReviewFields,
    parseReviewPage,
    traverseReview,
} from './clearSigningReview';
import { clearSigningScenarios } from '../../__fixtures__/clearSigning';

const reviewPage = (paragraphs: string[], activePage = 0): ReviewPage => ({
    paragraphs,
    activePage,
    pageCount: 1,
});

it('covers full and partial fills in both modes while preserving the signed Fusion order', () => {
    const abi = parseAbi([
        'function fillOrderArgs((uint256 salt, uint256 maker, uint256 receiver, uint256 makerAsset, uint256 takerAsset, uint256 makingAmount, uint256 takingAmount, uint256 makerTraits) order, bytes32 r, bytes32 vs, uint256 amount, uint256 takerTraits, bytes args)',
    ]);
    const calls = clearSigningScenarios
        .filter(scenario => scenario.transaction.data.startsWith('0xf497df75'))
        .map(
            scenario =>
                decodeFunctionData({ abi, data: scenario.transaction.data as `0x${string}` }).args,
        );

    expect(
        calls.map(call => ({ amount: call[3], isMakerAmount: Boolean(call[4] >> 255n) })),
    ).toEqual([
        { amount: 2_089_277_801_260_739n, isMakerAmount: false },
        { amount: 1_044_638_900_630_369n, isMakerAmount: false },
        { amount: 5_000_000n, isMakerAmount: true },
        { amount: 2_500_000n, isMakerAmount: true },
    ]);
    const [originalCall] = calls;
    if (!originalCall) throw new Error('Original Fusion call missing');

    for (const call of calls.slice(1)) {
        expect([call[0], call[1], call[2], call[5]]).toEqual([
            originalCall[0],
            originalCall[1],
            originalCall[2],
            originalCall[5],
        ]);
        expect(call[4] & ((1n << 255n) - 1n)).toBe(originalCall[4]);
    }
});

describe('Clear-signing review traversal', () => {
    const layout = (activePage: number) => ({
        content: { paragraphs: [[`Field ${activePage}:`], [`Value ${activePage}`]] },
        scrollbar: { scrollbar_page_count: 4, scrollbar_active_page: activePage },
    });

    it('uses ButtonRequest pages when T3T1 omits pagination from the layout', async () => {
        let activePage = 0;
        const controller: ReviewController = {
            getDebugState: vi.fn(() =>
                Promise.resolve({
                    tokens: [
                        JSON.stringify({
                            content: {
                                paragraphs: [[`Field ${activePage}`], [`Value ${activePage}`]],
                            },
                        }),
                    ],
                }),
            ),
            clickEmu: vi.fn(),
            swipeEmu: vi.fn(() => {
                activePage += 1;

                return Promise.resolve(null);
            }),
        };

        const pages = await traverseReview(controller, { model: Model.T3T1, pages: 4 });
        expect(pages.map(page => page.paragraphs[1])).toEqual([
            'Value 0',
            'Value 1',
            'Value 2',
            'Value 3',
        ]);
    });

    it('limits ButtonRequest pages to the review when Caesar also counts its fee-info menu', async () => {
        const controller: ReviewController = {
            getDebugState: vi.fn(() =>
                Promise.resolve({
                    tokens: [
                        JSON.stringify({
                            component: 'Flow',
                            flow_page: { text: ['Maximum fee:', '0.0005 ETH'], page_count: 1 },
                            scrollbar: { scrollbar_page_count: 3, scrollbar_active_page: 0 },
                        }),
                    ],
                }),
            ),
            clickEmu: vi.fn(),
            swipeEmu: vi.fn(),
        };

        await expect(
            traverseReview(controller, { model: Model.T3B1, pages: 3 }),
        ).resolves.toHaveLength(1);
        expect(controller.swipeEmu).not.toHaveBeenCalled();
    }, 10_000);

    it.each([Model.T2T1, Model.T3B1, Model.T3T1, Model.T3W1])(
        'collects all four pages on %s without consulting expected field values',
        async model => {
            let activePage = 0;
            const advance = () => {
                activePage += 1;

                return Promise.resolve(null);
            };
            const controller: ReviewController = {
                getDebugState: vi.fn(() =>
                    Promise.resolve({
                        tokens: [JSON.stringify(layout(activePage))],
                    }),
                ),
                clickEmu: vi.fn(advance),
                swipeEmu: vi.fn(advance),
            };

            const pages = await traverseReview(controller, { model });

            expect(pages.map(page => page.activePage)).toEqual([0, 1, 2, 3]);
            expect(pages.at(-1)?.paragraphs).toEqual(['Field 3:', 'Value 3']);
            expect(
                model === Model.T3W1 ? controller.clickEmu : controller.swipeEmu,
            ).toHaveBeenCalledTimes(3);
        },
    );

    it('waits for stable readable text before traversing a layout without an active-page index', async () => {
        let activePage = 0;
        let isTransition = true;
        const controller: ReviewController = {
            getDebugState: vi.fn(() => {
                if (isTransition) {
                    isTransition = false;

                    return Promise.resolve({ tokens: ['{"component":"Transition"}'] });
                }

                return Promise.resolve({
                    tokens: [
                        JSON.stringify({
                            Content: {
                                paragraphs: [[`Field ${activePage}`], [`Value ${activePage}`]],
                            },
                            page_count: 4,
                        }),
                    ],
                });
            }),
            clickEmu: vi.fn(() => {
                activePage += 1;
                isTransition = true;

                return Promise.resolve(null);
            }),
            swipeEmu: vi.fn(),
        };

        expect(
            (await traverseReview(controller, { model: Model.T3W1 })).map(
                page => page.paragraphs[1],
            ),
        ).toEqual(['Value 0', 'Value 1', 'Value 2', 'Value 3']);
    });

    it('fails when navigation skips a page', async () => {
        let activePage = 0;
        const controller: ReviewController = {
            getDebugState: vi.fn(() =>
                Promise.resolve({ tokens: [JSON.stringify(layout(activePage))] }),
            ),
            clickEmu: vi.fn(),
            swipeEmu: vi.fn(() => {
                activePage += 2;

                return Promise.resolve(null);
            }),
        };

        await expect(traverseReview(controller, { model: Model.T3B1 })).rejects.toThrow(/page 1/);
    }, 10_000);
});

describe('Clear-signing review fields', () => {
    it('associates values with labels instead of finding them elsewhere in the review', () => {
        const fields = getReviewFields([
            reviewPage(['Order purchasing amt:', '5 USDT', 'Amount to sell:', '0.005 WETH']),
        ]);

        expect(() =>
            assertReviewFields(fields, [{ label: 'Amount to sell', value: '5 USDT' }]),
        ).toThrow();
        expect(() =>
            assertReviewFields(fields, [{ label: 'Order purchasing amt', value: '5 USDT' }]),
        ).not.toThrow();
    });

    it('joins a wrapped value across consecutive review pages', () => {
        expect(
            getReviewFields([
                reviewPage(['Amount to Send:', '0.002089277801260-\n']),
                reviewPage(['739 WETH', 'Minimum to Receive:', '5 USDT'], 1),
            ]),
        ).toEqual([
            { label: 'Amount to Send', value: '0.002089277801260-\n739 WETH' },
            { label: 'Minimum to Receive', value: '5 USDT' },
        ]);
    });

    it('requires the raw review to show this transaction calldata', () => {
        const raw = {
            ...reviewPage(['View all data in the menu.', 'f497df750123abcd...']),
            title: 'Data: 8 / 12 bytes',
        };
        expect(() => assertRawReview([[raw]], '0xf497df750123abcdef')).not.toThrow();
        expect(() => assertRawReview([[raw]], '0xf497df750124abcdef')).toThrow();
        expect(() => assertRawReview([[reviewPage(['5 USDT'])]], '0xf497df750123abcdef')).toThrow();
    });

    it('requires removal of the fallback marker when production starts clear signing', () => {
        expect(() =>
            assertRawReview(
                [
                    [reviewPage(['1inch Network'])],
                    [reviewPage(['Fill order'])],
                    [reviewPage(['Amount to buy', '5 USDT'])],
                ],
                '0xf497df750123abcdef',
            ),
        ).toThrow();
    });

    it.each([
        { Content: { paragraphs: [['Amount'], ['5 USDT']] }, page_count: 3 },
        {
            content: { content: { paragraphs: [['Amount:'], ['5 USDT']] }, page_count: 3 },
            scrollbar: { scrollbar_page_count: 3, scrollbar_active_page: 1 },
        },
        {
            content: { paragraphs: [['Amount:'], ['5 USDT']] },
            page_count: 3,
        },
        {
            flow_page: { text: ['\n', 'Amount:', '\n', '5 USDT'], page_count: 3 },
        },
    ])('reads paragraphs and pagination from supported firmware layouts', layout => {
        expect(parseReviewPage(layout)).toMatchObject({
            paragraphs: [expect.stringMatching(/^Amount:?$/), '5 USDT'],
            pageCount: 3,
        });
    });

    it('rejects layouts without readable text', () => {
        expect(() => parseReviewPage({ component: 'Transition' })).toThrow(/Readable text/);
        expect(() => parseReviewPage({ Content: { paragraphs: [[' ', '\n']] } })).toThrow(
            /Readable text/,
        );
    });

    it('recognizes the final hold-to-sign prompt as a review page', () => {
        const layout = {
            component: 'Frame',
            content: { component: 'SwipeContent', content: { component: 'PromptScreen' } },
        };
        expect(parseReviewPage(layout)).toMatchObject({ paragraphs: [], isConfirmation: true });
    });

    it('uses review-page pagination rather than a scrollbar that includes the fee-info menu', () => {
        expect(
            parseReviewPage({
                flow_page: { text: ['Maximum fee:', '0.0005 ETH'], page_count: 1 },
                scrollbar: { scrollbar_page_count: 3, scrollbar_active_page: 0 },
            }).pageCount,
        ).toBe(1);
    });

    it('respects the page limit of a collapsed raw-data preview', () => {
        expect(
            parseReviewPage({
                Content: { paragraphs: [['f497df75abcd', '...']] },
                page_count: 3,
                page_limit: 1,
            }).pageCount,
        ).toBe(1);
    });
});
