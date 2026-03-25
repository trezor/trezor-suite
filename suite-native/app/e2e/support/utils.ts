import path from 'node:path';

import { Model } from '@trezor/trezor-user-env-link';
import { scheduleAction } from '@trezor/utils';

type ElementAttributes = {
    text?: string;
    label?: string;
    value?: string;
};

type ElementOrMatcher = Detox.NativeElement | Detox.NativeMatcher;

const isIndexableNativeElement = (v: ElementOrMatcher): v is Detox.NativeElement => {
    const anyV = v as any;

    return !!anyV && (typeof anyV.tap === 'function' || typeof anyV.atIndex === 'function');
};

export const platform = device.getPlatform();

// There is inconsistency between platforms. Android needs to have 100% of an element visible to be able to interact with it.
// On the other hand, if we are trying to scroll to 100% visibility on iOS, it causes scrolling more than height of the screen and it makes Detox crash.
const SCROLL_VISIBILITY_THRESHOLD = platform === 'android' ? 100 : undefined;

export const RETRY_CONF = {
    attempts: 5,
    gap: 500,
};

export const wait = async (ms: number) => {
    await new Promise(resolve => setTimeout(resolve, ms));
};

function pruneToAppStack(invocationStack: string): string {
    const thisFile = path.normalize(__filename);
    const lines = invocationStack.split('\n');
    const kept: string[] = [];

    for (const l of lines) {
        const m = l.match(/\s+at (?:.+ \()?(.*?):\d+:\d+\)?/);
        if (!m) continue;
        const file = path.normalize(m[1]);
        if (
            file.includes('node:') ||
            file.includes(`${path.sep}node_modules${path.sep}`) ||
            file === thisFile
        ) {
            continue;
        }
        kept.push(l);
    }

    return kept.length ? ['Error'].concat(kept).join('\n') : invocationStack;
}

function getTarget(elementOrMatcher: ElementOrMatcher) {
    return isIndexableNativeElement(elementOrMatcher)
        ? elementOrMatcher
        : element(elementOrMatcher);
}

export const waitForVisible = async (
    elementOrMatcher: ElementOrMatcher,
    { timeout = 30_000 }: { timeout?: number } = {},
) => {
    const target = getTarget(elementOrMatcher);
    const invocationStack = new Error().stack || '';
    try {
        await waitFor(target).toBeVisible().withTimeout(timeout);
    } catch (error) {
        const details = `waitForVisible(): target not visible after ${timeout}ms`;
        const appStackError = new Error(details, { cause: error as Error });
        appStackError.stack = `${appStackError.name}: ${appStackError.message}\n${pruneToAppStack(invocationStack)}`;
        throw appStackError;
    }
};

export const waitToHaveText = async (
    elementOrMatcher: ElementOrMatcher,
    expectedText: string,
    { timeout = 30_000 }: { timeout?: number } = {},
) => {
    const target = getTarget(elementOrMatcher);
    await waitForVisible(target, { timeout });
    await scheduleAction(async () => {
        const attributes = await target.getAttributes();
        const actualText = (attributes as ElementAttributes).text;

        if (actualText !== expectedText) {
            throw new Error(
                `waitForText(): target text "${actualText}" did not equal expected "${expectedText}" after ${timeout}ms`,
            );
        }
    }, RETRY_CONF);
};

export const waitToHaveRegex = async (
    elementOrMatcher: ElementOrMatcher,
    expectedRegex: RegExp,
    {
        timeout = 30_000,
        attributeType = 'text',
    }: { timeout?: number; attributeType?: 'text' | 'label' | 'value' } = {},
) => {
    const target = getTarget(elementOrMatcher);
    await waitForVisible(target, { timeout });
    await scheduleAction(async () => {
        const attributes = await target.getAttributes();
        const testedAttribute = (attributes as ElementAttributes)[attributeType];

        if (typeof testedAttribute !== 'string') {
            throw new Error(
                `waitForRegex(): could not get "${attributeType}" property from the element`,
            );
        }

        if (!expectedRegex.test(testedAttribute)) {
            throw new Error(
                `waitForRegex(): target text "${testedAttribute}" not matching ${expectedRegex} after ${timeout}ms`,
            );
        }
    }, RETRY_CONF);
};

export const appIsFullyLoaded = async () => {
    await waitForVisible(by.id('@screen/mainScrollView'), { timeout: 35_000 });
};

export const scrollUntilVisible = async (
    target: Detox.IndexableNativeElement,
    options?: { scrollViewTestId?: string; startPositionX?: number; startPositionY?: number },
) => {
    await waitFor(target)
        .toBeVisible(SCROLL_VISIBILITY_THRESHOLD)
        .whileElement(by.id(options?.scrollViewTestId ?? '@screen/mainScrollView'))
        .scroll(300, 'down', options?.startPositionX ?? 0.5, options?.startPositionY ?? 0.5);
};

export const inputTextToElement = async (element: Detox.IndexableNativeElement, text: string) => {
    // on Android it is very slow to type text symbol by symbol, for performance reasons `replaceText` is used instead.
    if (platform === 'android') {
        await element.replaceText(text);
    } else {
        // on iOS the replaceText do not trigger input events (focus, blur, etc.) so we need can not paste text there as for Android.
        // the typeText method is way faster than for Android, so there is not performance drawback.
        await element.tap();
        await element.typeText(text);
    }
};

// Use this method in absolute necessity only! Try-catch in tests is discouraged because it may hide real issues.
export const isElementVisible = async (elementOrMatcher: ElementOrMatcher): Promise<boolean> => {
    const target = isIndexableNativeElement(elementOrMatcher)
        ? elementOrMatcher
        : element(elementOrMatcher);
    try {
        await waitFor(target).toBeVisible().withTimeout(5_000);

        return true;
    } catch {
        return false;
    }
};

export function getModelFromEnv(): Model {
    const envValue = process.env.TDR_MODEL as Model;

    return envValue in Model ? envValue : Model.T3T1;
}
