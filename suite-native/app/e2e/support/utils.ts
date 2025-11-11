import path from 'node:path';

const isIndexableNativeElement = (
    v: Detox.IndexableNativeElement | Detox.NativeMatcher,
): v is Detox.IndexableNativeElement => {
    const anyV = v as any;

    return !!anyV && (typeof anyV.tap === 'function' || typeof anyV.atIndex === 'function');
};

export const platform = device.getPlatform();

// There is inconsistency between platforms. Android needs to have 100% of an element visible to be able to interact with it.
// On the other hand, if we are trying to scroll to 100% visibility on iOS, it causes scrolling more than height of the screen and it makes Detox crash.
const SCROLL_VISIBILITY_THRESHOLD = platform === 'android' ? 100 : undefined;

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

export const waitForVisible = async (
    elementOrMatcher: Detox.IndexableNativeElement | Detox.NativeMatcher,
    { timeout = 30_000 }: { timeout?: number } = {},
) => {
    const target = isIndexableNativeElement(elementOrMatcher)
        ? elementOrMatcher
        : element(elementOrMatcher);
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

export const appIsFullyLoaded = async () => {
    await waitForVisible(by.id('@screen/mainScrollView'), { timeout: 35_000 });
};

export const scrollUntilVisible = async (
    target: Detox.IndexableNativeElement,
    scrollViewTestId: string = '@screen/mainScrollView',
) => {
    await waitFor(target)
        .toBeVisible(SCROLL_VISIBILITY_THRESHOLD)
        .whileElement(by.id(scrollViewTestId))
        .scroll(300, 'down', 0.5, 0.5);
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
