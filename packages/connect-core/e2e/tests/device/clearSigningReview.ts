import { expect } from 'vitest';

import { Model, type TrezorUserEnvLinkClass } from '@trezor/trezor-user-env-link';

export type ReviewController = Pick<
    TrezorUserEnvLinkClass,
    'getDebugState' | 'clickEmu' | 'swipeEmu'
>;

export type ReviewField = {
    label: string;
    value: string;
};

export type ReviewPage = {
    paragraphs: string[];
    activePage?: number;
    pageCount?: number;
    pageLimit?: number;
    title?: string;
    isConfirmation?: boolean;
};

type ReviewRequest = { model: Model; pages?: number };

type DisplayLayout = {
    component?: string;
    page_count?: number;
    page_limit?: number;
    scrollbar?: { scrollbar_page_count: number; scrollbar_active_page: number };
    title?: { text: string } | string;
    header?: { title: { text: string } };
    Header?: { title: { text: string } };
    Content?: { paragraphs: string[][] };
    content?: {
        component?: string;
        content?: { component?: string; paragraphs?: string[][] };
        paragraphs?: string[][];
    };
    flow_page?: { text: string[]; page_count?: number };
};

export const normalizeReviewText = (value: string) =>
    value
        .replace(/(\d)-\s+(?=\d)/g, '$1')
        .replace(/\s/g, '')
        .toLowerCase();

const findLayoutNumber = (layout: unknown, key: string): number | undefined => {
    if (!layout || typeof layout !== 'object') return;

    for (const [name, value] of Object.entries(layout)) {
        if (name === key && typeof value === 'number') return value;
        const nested = findLayoutNumber(value, key);
        if (nested !== undefined) return nested;
    }
};

const hasLayoutComponent = (layout: unknown, component: string): boolean => {
    if (!layout || typeof layout !== 'object') return false;

    return Object.entries(layout).some(
        ([key, value]) =>
            (key === 'component' && value === component) || hasLayoutComponent(value, component),
    );
};

export const parseReviewPage = (layout: DisplayLayout): ReviewPage => {
    const paragraphs =
        layout.Content?.paragraphs ??
        layout.content?.content?.paragraphs ??
        layout.content?.paragraphs ??
        layout.flow_page?.text.map(text => [text]);
    const isConfirmation = hasLayoutComponent(layout, 'PromptScreen');
    const text = paragraphs?.map(lines => lines.join('')).filter(paragraph => paragraph.trim());
    if (!text?.length && !isConfirmation) {
        throw new Error(`Readable text missing from the Trezor display: ${JSON.stringify(layout)}`);
    }

    const pageCount =
        findLayoutNumber(layout, 'page_count') ?? findLayoutNumber(layout, 'scrollbar_page_count');

    return {
        paragraphs: text ?? [],
        isConfirmation,
        // A collapsed raw-data preview can report the expanded view's page count.
        pageCount:
            pageCount === undefined
                ? undefined
                : Math.min(pageCount, findLayoutNumber(layout, 'page_limit') ?? pageCount),
        pageLimit: findLayoutNumber(layout, 'page_limit'),
        activePage:
            findLayoutNumber(layout, 'scrollbar_active_page') ??
            findLayoutNumber(layout, 'active_page'),
        title:
            layout.Header?.title.text ??
            layout.header?.title.text ??
            (typeof layout.title === 'string' ? layout.title : layout.title?.text),
    };
};

export const traverseReview = async (controller: ReviewController, request: ReviewRequest) => {
    const { model } = request;
    const pages: ReviewPage[] = [];
    let previousLayout: string | undefined;
    let pageCount = 1;

    for (let index = 0; index < pageCount; index++) {
        let lastRead: string | undefined;
        let page: ReviewPage | undefined;
        await expect
            .poll(
                async () => {
                    const { tokens } = await controller.getDebugState();
                    const currentLayout = tokens.join('');
                    const isStable = currentLayout === lastRead;
                    lastRead = currentLayout;
                    if (!isStable || currentLayout === previousLayout) return;

                    const currentPage = parseReviewPage(JSON.parse(currentLayout));
                    if (currentPage.activePage !== undefined && currentPage.activePage !== index) {
                        return;
                    }
                    if (
                        index > 0 &&
                        !currentPage.isConfirmation &&
                        currentPage.title !== pages[0]?.title
                    )
                        return;
                    page = currentPage;

                    return currentPage;
                },
                { timeout: 5_000, message: `Waiting for Trezor review page ${index}` },
            )
            .toBeDefined()
            .catch(error => {
                throw new Error(
                    `Cannot read ${model} review page ${index}; last layout: ${lastRead}`,
                    { cause: error },
                );
            });
        expect(page, `Trezor review page ${index}: ${lastRead}`).toBeDefined();
        if (!page) throw new Error(`Missing Trezor review page ${index}`);

        // ButtonRequest supplies pagination on models whose layout JSON omits it.
        const effectivePageCount = Math.min(
            request.pages ?? page.pageCount ?? 1,
            page.pageCount ?? Infinity,
            page.pageLimit ?? Infinity,
        );
        expect(effectivePageCount, 'Bounded Trezor review pagination').toBeGreaterThan(0);
        expect(effectivePageCount, 'Bounded Trezor review pagination').toBeLessThanOrEqual(100);
        if (index === 0) pageCount = effectivePageCount;
        expect(effectivePageCount, 'Trezor review page count changed').toBe(pageCount);
        pages.push(page);
        previousLayout = lastRead;

        if (index + 1 < pageCount) {
            if (model === Model.T3W1) {
                // T3W1 uses the action-bar button; the other models use a swipe or right button.
                await controller.clickEmu({ x: 200, y: 480 });
            } else {
                await controller.swipeEmu('up');
            }
        }
    }

    return pages;
};

export const getReviewFields = (pages: ReviewPage[]): ReviewField[] => {
    const paragraphs: string[] = [];
    for (const page of pages) {
        for (const paragraph of page.paragraphs) {
            const last = paragraphs.at(-1);
            if (last?.match(/-\s*$/)) {
                paragraphs[paragraphs.length - 1] = last + paragraph;
            } else {
                paragraphs.push(paragraph);
            }
        }
    }

    const fields: ReviewField[] = [];
    for (const [index, label] of paragraphs.entries()) {
        const value = paragraphs[index + 1];
        if (index % 2 === 0 && value !== undefined) {
            fields.push({ label: label.replace(/:$/, ''), value });
        }
    }

    return fields;
};

export const assertReviewFields = (fields: ReviewField[], expected: ReviewField[]) => {
    for (const field of expected) {
        const matches = fields.filter(
            actual => normalizeReviewText(actual.label) === normalizeReviewText(field.label),
        );
        expect(
            matches.map(actual => normalizeReviewText(actual.value)),
            `Review field "${field.label}": ${JSON.stringify(fields)}`,
        ).toEqual([normalizeReviewText(field.value)]);
    }
};

export const assertRawReview = (reviews: ReviewPage[][], calldata: string) => {
    const dataPages = reviews.flat().filter(page => /\bdata\b/i.test(page.title ?? ''));
    expect(
        dataPages.length,
        'Known raw fallback no longer reproduces; remove its marker',
    ).toBeGreaterThan(0);
    const displayedData = dataPages
        .flatMap(page => page.paragraphs)
        .map(normalizeReviewText)
        .filter(text => /^[0-9a-f]+(?:\.\.\.)?$/i.test(text))
        .join('')
        .replace(/\.\.\.$/, '');
    expect(displayedData, 'Raw transaction selector').toMatch(/^[0-9a-f]{8}/);
    expect(
        calldata.slice(2).toLowerCase().startsWith(displayedData),
        'Raw review shows this transaction',
    ).toBe(true);
};
