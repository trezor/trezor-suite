export type Paragraph = any;

export interface NormalizedDisplayContent {
    header: {
        title: string;
        subtitle?: string;
    };
    body: Paragraph[];
    actions?: Record<string, string> | null;
    footer?: string | null;
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
        let current = obj;

        for (const segment of path) {
            if (current && typeof current === 'object' && segment in current) {
                current = current[segment];
            } else {
                current = undefined;
                break;
            }
        }

        if (current !== undefined) return current;
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

function extractActionsFromActionBar(json: any): Record<string, string> {
    const actionBar = json?.ActionBar;
    if (!actionBar || typeof actionBar !== 'object') return {};

    const actions: Record<string, string> = {};
    for (const [key, value] of Object.entries(actionBar)) {
        if (!/button/i.test(key)) continue;
        if (!value || typeof value !== 'object') continue;
        if (typeof (value as any).text !== 'string') continue;
        actions[key] = (value as any).text;
    }

    return actions;
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

    const paragraphsWithoutEmptyTokens = paragraphs.filter(
        (paragraph: any) =>
            !Array.isArray(paragraph) || paragraph.length !== 1 || paragraph[0] !== ' ',
    );

    // footer: could be footer.instruction or simple footer string/object
    const footerCandidate = getValueAtPaths(json, [
        ['footer', 'instruction'],
        ['Footer', 'instruction'],
        ['footer'],
        ['Footer'],
    ]);
    const footer = extractTextish(footerCandidate);

    // T3W1 has ActionBar with buttons instead of the footer
    const actions = extractActionsFromActionBar(json);
    const areActionsPresent = Object.keys(actions).length > 0;

    if (areActionsPresent && footer) {
        throw new Error(
            `Unexpected Display content: both actions and footer present: ${JSON.stringify(json)}`,
        );
    }

    const result: NormalizedDisplayContent = {
        header: subtitle ? { title, subtitle } : { title },
        body: paragraphsWithoutEmptyTokens,
        ...(areActionsPresent ? { actions } : {}),
        ...(footer ? { footer } : {}),
    };

    return result;
}
