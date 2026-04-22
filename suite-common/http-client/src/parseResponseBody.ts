const isJsonContentType = (contentType: string) =>
    contentType.includes('application/json') || contentType.includes('+json');

export async function parseResponseBody<T>(res: Response): Promise<T | null> {
    try {
        // These statuses must not include a response body per HTTP spec.
        if ([204, 205, 304].includes(res.status)) return null;

        const contentType = (res.headers.get('content-type') ?? '').toLowerCase();

        if (isJsonContentType(contentType)) {
            return res.json() as T;
        }

        if (contentType.includes('text/')) {
            return res.text() as T;
        }

        if (contentType.includes('application/x-www-form-urlencoded')) {
            const text = await res.text();

            return new URLSearchParams(text) as T;
        }

        if (contentType.includes('multipart/form-data')) {
            return res.formData() as T;
        }

        if (
            contentType.includes('application/octet-stream') ||
            contentType.startsWith('image/') ||
            contentType.startsWith('audio/') ||
            contentType.startsWith('video/')
        ) {
            return res.blob() as T;
        }

        return res.text() as T;
    } catch (error) {
        console.error(error);

        return null;
    }
}
