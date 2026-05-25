export function delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise<void>(resolve => {
        const timeoutId = setTimeout(resolve, ms);

        if (signal) {
            signal.addEventListener('abort', () => {
                clearTimeout(timeoutId);
            });
        }
    });
}
