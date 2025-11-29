export type Paragraph = any;

export interface NormalizedDisplayContent {
    header: {
        title: string;
        subtitle?: string;
    };
    body: Paragraph[];
    footer?: string;
}

function getFirstPresent<T = any>(obj: any, keys: string[]): T | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) {
            return obj[k] as T;
        }
    }

    return undefined;
}

function getValueAtPaths(obj: any, paths: string[][]): any {
    for (const path of paths) {
        let cur = obj;
        let ok = true;
        for (const seg of path) {
            if (cur && typeof cur === 'object' && seg in cur) {
                cur = cur[seg];
            } else {
                ok = false;
                break;
            }
        }
        if (ok) return cur;
    }

    return undefined;
}

function extractTextish(value: any): string | undefined {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return undefined;
    if (typeof value.text === 'string') return value.text;
    if (typeof value.instruction === 'string') return value.instruction;

    return undefined;
}

// Vibecode Warning
// Parses raw JSON from Trezor device display into a normalized structure.
// The structure of the input JSON varies between device models
export function parseDisplayContent(json: any): NormalizedDisplayContent {
    if (!json || typeof json !== 'object') {
        throw new Error(`Display content invalid: expected object, got ${typeof json}`);
    }

    // header can be json.header (T3T1) or json.Header (T3W1)
    const headerObj = getFirstPresent(json, ['header', 'Header']);
    if (!headerObj || typeof headerObj !== 'object') {
        throw new Error(`Display content invalid, missing header: ${JSON.stringify(json)}`);
    }

    const titleCandidate = getFirstPresent(headerObj, ['title', 'Title']);
    const title = extractTextish(titleCandidate);
    if (!title) {
        throw new Error(
            `Display content invalid, header.title.text missing: ${JSON.stringify(headerObj)}`,
        );
    }

    const subtitleCandidate = getFirstPresent(headerObj, ['subtitle', 'Subtitle']);
    const subtitle = extractTextish(subtitleCandidate);

    // paragraphs: try multiple likely paths
    const paragraphs = getValueAtPaths(json, [
        ['content', 'content', 'paragraphs'], // original default
        ['Content', 'paragraphs'], // T3W1
        ['content', 'paragraphs'], // possible variation
    ]);

    if (!Array.isArray(paragraphs) || paragraphs.length < 1) {
        throw new Error(
            `Expected at least one paragraph in display JSON, JSON: ${JSON.stringify(paragraphs)}`,
        );
    }

    // footer: could be footer.instruction or simple footer string/object
    const footerCandidate = getValueAtPaths(json, [
        ['footer', 'instruction'],
        ['Footer', 'instruction'],
        ['footer'],
        ['Footer'],
    ]);
    const footer = extractTextish(footerCandidate);

    const result: NormalizedDisplayContent = {
        header: subtitle ? { title, subtitle } : { title },
        body: paragraphs,
        ...(footer ? { footer } : {}),
    };

    return result;
}
