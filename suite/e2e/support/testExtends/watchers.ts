/* eslint-disable react-hooks/rules-of-hooks */

import { type Page, type TestInfo } from '@playwright/test';
import { inspect } from 'node:util';

export type CapturedToast = { testId: string; intent: string; text: string };

const formatError = (error: unknown): string => {
    if (error instanceof Error) {
        let output = error.stack || `${error.name}: ${error.message}`;

        if (error.cause) {
            output += `\nCaused by: ${formatError(error.cause)}`;
        }

        return output;
    }

    if (typeof error === 'object' && error !== null) {
        /*
         * Fallback for non-Error objects.
         * Use Node's `util.inspect` to safely handle circular references
         * without crashes during test teardown.
         */
        return inspect(error, { showHidden: false, depth: 3, colors: false, getters: true });
    }

    return String(error);
};

const formatToast = (toast: CapturedToast): string =>
    `[${toast.intent}] ${toast.testId}: ${toast.text}`;

const installToastObserver = () => {
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof Element)) continue;

                const toastElements = [
                    ...(node.matches('[data-toast-intent]') ? [node] : []),
                    ...node.querySelectorAll('[data-toast-intent]'),
                ];

                for (const el of toastElements) {
                    const intent = el.getAttribute('data-toast-intent');

                    if (intent === 'critical' || intent === 'warning') {
                        (window as any).__reportToast({
                            testId: el.getAttribute('data-testid') ?? '',
                            intent,
                            text: el.textContent?.trim() ?? '',
                        });
                    }
                }
            }
        }
    });

    observer.observe(document, { childList: true, subtree: true });
};

const isExceptionIgnored = (message: string, ignoreJSExceptions: string[]): boolean =>
    ignoreJSExceptions.some(pattern => message.toLowerCase().includes(pattern.toLowerCase()));

const isToastIgnored = (toast: CapturedToast, ignoreToastErrors: string[]): boolean =>
    ignoreToastErrors.some(pattern => toast.text.toLowerCase().includes(pattern.toLowerCase()));

export const jsExceptionWatcher = async (
    { page, ignoreJSExceptions }: { page: Page; ignoreJSExceptions: string[] },
    use: () => Promise<void>,
    testInfo: TestInfo,
) => {
    const errors: Error[] = [];
    const ignored: Error[] = [];

    page.on('pageerror', (error: Error) => {
        const message = error?.message || '';

        if (isExceptionIgnored(message, ignoreJSExceptions)) {
            ignored.push(error);
        } else {
            errors.push(error);
        }
    });

    await use();

    if (ignored.length > 0) {
        testInfo.annotations.push({
            type: 'Warning, Ignored JS exceptions',
            description: `\n${ignored.map(formatError).join('\n-----\n')}`,
        });
    }

    if (errors.length > 0) {
        throw new Error(
            `There was a JS exception during test run.\n${errors.map(formatError).join('\n-----\n')}`,
        );
    }
};

export const toastErrorWatcher = async (
    { page, ignoreToastErrors }: { page: Page; ignoreToastErrors: string[] },
    use: () => Promise<void>,
    testInfo: TestInfo,
) => {
    const captured: CapturedToast[] = [];

    await page.exposeFunction('__reportToast', (toast: CapturedToast) => {
        captured.push(toast);
    });

    // Inject into the already-loaded page so the observer is active for the whole test.
    await page.evaluate(installToastObserver);
    // Register for any subsequent full navigations within the test.
    await page.addInitScript(installToastObserver);

    await use();

    const unexpected = captured.filter(toast => !isToastIgnored(toast, ignoreToastErrors));

    if (unexpected.length > 0) {
        const description = unexpected.map(formatToast).join('\n');
        testInfo.annotations.push({ type: 'Unexpected toast notifications', description });
        throw new Error(
            `Unexpected error/warning toast notification(s) appeared during test:\n${description}`,
        );
    }
};
