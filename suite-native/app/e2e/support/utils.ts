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

export const waitForVisible = async (
    elementOrMatcher: Detox.IndexableNativeElement | Detox.NativeMatcher,
    { timeout = 30_000 }: { timeout?: number } = {},
) => {
    const target = isIndexableNativeElement(elementOrMatcher)
        ? elementOrMatcher
        : element(elementOrMatcher);
    await waitFor(target).toBeVisible().withTimeout(timeout);
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
