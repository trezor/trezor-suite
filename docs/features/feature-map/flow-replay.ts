// Replays capture flows from parts/capture-flows.json on a simulator through the agent-device CLI.
//
// Suite Native renders every screen inside an `accessible` container
// (suite-native/navigation/src/components/Screen.tsx), so iOS exposes a whole screen as one
// accessibility element and testIDs inside it cannot be targeted. Steps therefore tap either an
// exposed testID (tab bar, headers outside the screen container, system alerts) or visible text
// located by OCR on a fresh screenshot. The arrival screen is then saved and checked by OCR.

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as nodePath from 'node:path';

export type ReplayStep = {
    do: 'launch' | 'tap' | 'scroll_to' | 'type' | 'wait_text' | 'alert' | 'back' | 'scroll';
    id?: string;
    text?: string;
    nth?: number;
    test_id?: string;
    value?: string;
    direction?: 'down' | 'up';
    // Tap `dx` points right of the right edge of the `id` element, vertically centred. For icon
    // buttons that expose neither an identifier nor text (e.g. the header notification bell).
    right_of?: number;
    // Offsets for a text-located tap, e.g. an icon button in the same row as a label.
    dx?: number;
    dy?: number;
    x_from_right?: number;
    lands_on: string;
};

type OcrWord = { text: string; left: number; top: number; width: number; height: number };
type Box = { x: number; y: number; left: number; top: number; right: number; bottom: number };

export type ReplayOptions = {
    agentDevice: string;
    appId: string;
    tesseract: string;
    workDir: string;
    pixelDensity: number;
    log: (message: string) => void;
};

const WAIT_MS = 10000;
const SCROLL_LIMIT = 12;
// Finger-path fraction of the viewport per scroll pass.
const SCROLL_AMOUNT = '0.35';
// A scroll target must end above this share of the screen height (tab bar, home indicator).
const SAFE_BOTTOM = 0.88;
// Taps (e.g. in a bottom sheet, which covers the tab bar) only avoid the home indicator.
const TAP_BOTTOM = 0.95;

const normalise = (text: string): string =>
    text
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[‘’]/g, "'")
        // OCR reads a standalone capital I as a vertical bar.
        .replace(/(^|\s)\|(?=\s|$)/g, '$1i')
        .replace(/[^\p{L}\p{N}' ]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const run = (options: ReplayOptions, args: string[], timeout = 120000): string =>
    execFileSync(options.agentDevice, args, {
        encoding: 'utf8',
        timeout,
        stdio: ['ignore', 'pipe', 'pipe'],
    });

export const screenshot = (options: ReplayOptions, path: string): void => {
    run(options, ['screenshot', path, '--pixel-density', String(options.pixelDensity)]);
};

// OCR passes tried in order until the phrase is found. Sparse-text segmentation reads short UI
// labels next to icons far better than the default layout; local (Sauvola) thresholding reads
// dark text on coloured buttons; the default layout reads some labels on tinted overlays.
export const OCR_PASSES: string[][] = [
    ['--psm', '11'],
    ['--psm', '11', '-c', 'thresholding_method=2'],
    ['--psm', '3'],
];

const ocrWords = (options: ReplayOptions, image: string, pass: string[]): OcrWord[] => {
    const tsv = execFileSync(options.tesseract, [image, '-', ...pass, 'tsv'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
    });

    return tsv
        .split('\n')
        .slice(1)
        .map(row => row.split('\t'))
        .filter(cells => cells.length >= 12 && cells[0] === '5' && normalise(cells[11]) !== '')
        .map(cells => ({
            text: normalise(cells[11]),
            left: Number(cells[6]),
            top: Number(cells[7]),
            width: Number(cells[8]),
            height: Number(cells[9]),
        }));
};

/** Groups words into visual rows (overlapping vertical centres), each sorted left to right. */
const visualRows = (words: OcrWord[]): OcrWord[][] => {
    const rows: OcrWord[][] = [];
    for (const word of [...words].sort((a, b) => a.top - b.top || a.left - b.left)) {
        const centre = word.top + word.height / 2;
        const row = rows.find(candidate => {
            const first = candidate[0];

            return (
                Math.abs(first.top + first.height / 2 - centre) <
                Math.max(first.height, word.height) / 2
            );
        });
        if (row) row.push(word);
        else rows.push([word]);
    }

    return rows.map(row => row.sort((a, b) => a.left - b.left));
};

/**
 * Boxes (in screen points) of every occurrence of `phrase` as adjacent words in one visual row.
 * A match must start its row segment (ignoring 1-2 character icon noise), so "Security" never matches
 * "Privacy & security". Matches with the fewest other words in the row win, so "Bitcoin" prefers
 * the value row over "Bitcoin units". Ties keep top-to-bottom order for `nth`.
 */
export const findPhrase = (words: OcrWord[], phrase: string, density: number): Box[] => {
    const needle = normalise(phrase).split(' ');
    const ranked: { box: Box; rank: number }[] = [];
    for (const row of visualRows(words)) {
        for (let i = 0; i + needle.length <= row.length; i++) {
            const slice = row.slice(i, i + needle.length);
            if (!slice.every((word, k) => word.text === needle[k])) continue;
            const adjacent = slice.every(
                (word, k) =>
                    k === 0 ||
                    word.left - (slice[k - 1].left + slice[k - 1].width) < 2.5 * word.height,
            );
            if (!adjacent) continue;
            const left = Math.min(...slice.map(word => word.left)) / density;
            const top = Math.min(...slice.map(word => word.top)) / density;
            const right = Math.max(...slice.map(word => word.left + word.width)) / density;
            const bottom = Math.max(...slice.map(word => word.top + word.height)) / density;
            const box = {
                x: Math.round((left + right) / 2),
                y: Math.round((top + bottom) / 2),
                left,
                top,
                right,
                bottom,
            };
            // A longer word just before the match means the phrase continues a sentence; a distant
            // one is a separate element in the same row (e.g. side-by-side tabs).
            const previous = row
                .slice(0, i)
                .reverse()
                .find(word => word.text.length > 2);
            if (
                previous &&
                slice[0].left - (previous.left + previous.width) < 1.5 * slice[0].height
            )
                continue;
            const extra = row.filter(word => word.text.length > 2).length - needle.length;
            ranked.push({ box, rank: Math.max(extra, 0) });
        }
    }
    const best = Math.min(...ranked.map(entry => entry.rank));

    return ranked
        .filter(entry => entry.rank === best)
        .map(entry => entry.box)
        .sort((a, b) => a.top - b.top || a.left - b.left);
};

// `signature` is the text below the status bar from the first OCR pass; an unchanged signature
// after a scroll means the content edge was reached.
type Screen = { boxes: Box[]; width: number; height: number; signature: string };

const locate = (options: ReplayOptions, phrase: string, nth: number, tag: string): Screen => {
    const image = nodePath.join(options.workDir, `${tag}.png`);
    screenshot(options, image);
    let boxes: Box[] = [];
    let signature = '';
    // The PNG header stores the width at byte 16 and the height at byte 20.
    const header = fs.readFileSync(image);
    const pixelHeight = header.readUInt32BE(20);
    for (const [index, pass] of OCR_PASSES.entries()) {
        const words = ocrWords(options, image, pass);
        if (index === 0)
            signature = words
                .filter(word => word.top > pixelHeight * 0.08)
                .map(word => word.text)
                .join(' ');
        boxes = findPhrase(words, phrase, options.pixelDensity);
        if (boxes.length >= nth) break;
    }

    return {
        boxes: boxes.slice(nth - 1),
        signature,
        width: header.readUInt32BE(16) / options.pixelDensity,
        height: header.readUInt32BE(20) / options.pixelDensity,
    };
};

/** Where to tap for a located text: its centre, or an offset for icon buttons beside the text. */
const tapPoint = (step: ReplayStep, box: Box, screen: Screen): [number, number] => [
    Math.round(
        step.x_from_right !== undefined ? screen.width - step.x_from_right : box.x + (step.dx ?? 0),
    ),
    Math.round(box.y + (step.dy ?? 0)),
];

type NodeRect = { x: number; y: number; width: number; height: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

const parseNodeRect = (raw: string): NodeRect => {
    const parsed: unknown = JSON.parse(raw);
    const data = isRecord(parsed) ? parsed.data : null;
    const node = isRecord(data) ? data.node : null;
    const rect = isRecord(node) ? node.rect : null;
    if (
        !isRecord(rect) ||
        !isFiniteNumber(rect.x) ||
        !isFiniteNumber(rect.y) ||
        !isFiniteNumber(rect.width) ||
        !isFiniteNumber(rect.height)
    ) {
        throw new Error('agent-device get attrs returned unexpected node.rect shape');
    }

    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
};

const requireString = (value: string | undefined, field: string, stepDo: string): string => {
    if (typeof value !== 'string') throw new Error(`${stepDo} step is missing ${field}`);

    return value;
};

const formatReplayError = (error: unknown): string => {
    if (isRecord(error) && typeof error.stderr === 'string' && error.stderr.trim()) {
        return error.stderr.split('\n')[0].trim();
    }
    if (error instanceof Error) return error.message.split('\n')[0].trim();

    return String(error).split('\n')[0].trim();
};

const tapText = (options: ReplayOptions, step: ReplayStep, tag: string): void => {
    const phrase = requireString(step.text, 'text', step.do);
    const deadline = Date.now() + WAIT_MS;
    for (;;) {
        const screen = locate(options, phrase, step.nth ?? 1, tag);
        const box = screen.boxes.find(candidate => candidate.y < screen.height * TAP_BOTTOM);
        if (box) {
            const [x, y] = tapPoint(step, box, screen);
            run(options, ['press', String(x), String(y)]);

            return;
        }
        if (Date.now() > deadline) throw new Error(`text "${phrase}" not found on screen`);
        run(options, ['wait', '700']);
    }
};

const scrollTo = (options: ReplayOptions, step: ReplayStep, tag: string): void => {
    const phrase = requireString(step.text, 'text', step.do);
    // Short passes so a target is not skipped; search back the other way if the edge is reached.
    const forward = step.direction ?? 'down';
    const directions = [forward, forward === 'down' ? 'up' : 'down'];
    for (const direction of directions) {
        // An unchanged screen after a scroll can still be settling; twice in a row is the edge.
        let stalled = 0;
        let previous = '';
        for (let attempt = 0; attempt <= SCROLL_LIMIT && stalled < 2; attempt++) {
            const screen = locate(options, phrase, step.nth ?? 1, `${tag}-${direction}${attempt}`);
            stalled = attempt && screen.signature === previous ? stalled + 1 : 0;
            previous = screen.signature;
            // At the content edge a target may sit lower, e.g. the last row of a screen without
            // a tab bar.
            const bottom = (stalled ? TAP_BOTTOM : SAFE_BOTTOM) * screen.height;
            if (screen.boxes.some(box => box.bottom < bottom && box.top > screen.height * 0.12))
                return;
            run(options, ['scroll', direction, SCROLL_AMOUNT]);
            // Let momentum finish so the next screenshot shows the new position.
            run(options, ['wait', 'stable', '400', '5000']);
        }
    }
    throw new Error(`text "${phrase}" not reached by scrolling`);
};

const runStep = (options: ReplayOptions, step: ReplayStep, tag: string): void => {
    switch (step.do) {
        case 'launch':
            run(options, ['open', options.appId, '--relaunch'], 300000);

            return;
        case 'tap':
            if (step.id && step.right_of !== undefined) {
                run(options, ['wait', `id="${step.id}"`, String(WAIT_MS)]);
                const rect = parseNodeRect(
                    run(options, ['get', 'attrs', `id="${step.id}"`, '--json']),
                );
                run(options, [
                    'press',
                    String(Math.round(rect.x + rect.width + step.right_of)),
                    String(Math.round(rect.y + rect.height / 2)),
                ]);
            } else if (step.id) {
                run(options, ['wait', `id="${step.id}"`, String(WAIT_MS)]);
                run(options, ['press', `id="${step.id}"`]);
            } else tapText(options, step, tag);

            return;
        case 'scroll_to':
            scrollTo(options, step, tag);

            return;
        case 'scroll':
            run(options, ['scroll', step.direction ?? 'down']);

            return;
        case 'type':
            // Without `text` the step types into the field that already has focus.
            if (step.text) tapText(options, step, tag);
            run(options, ['type', requireString(step.value, 'value', step.do)]);

            return;
        case 'wait_text':
            run(options, [
                'wait',
                'text',
                requireString(step.text, 'text', step.do),
                String(WAIT_MS),
            ]);

            return;
        case 'alert':
            run(options, ['alert', 'wait', String(WAIT_MS)]);
            run(options, ['alert', requireString(step.value, 'value', step.do)]);

            return;
        case 'back':
            run(options, ['back']);

            return;
        default: {
            const unknown: never = step.do;
            throw new Error(`unsupported replay step action: ${String(unknown)}`);
        }
    }
};

export type ReplayResult = { result: 'pass' | 'diverged'; failedStep: number | null; note: string };

/** Runs all steps, settles, and saves the arrival screenshot to `arrivalImage`. */
export const replayFlow = (
    options: ReplayOptions,
    id: string,
    steps: ReplayStep[],
    arrivalImage: string,
): ReplayResult => {
    for (const [index, step] of steps.entries()) {
        const label = `${index + 1}/${steps.length} ${step.do} ${step.id ?? step.text ?? step.value ?? ''}`;
        options.log(`  ${id} step ${label}`);
        try {
            runStep(options, step, `${id}-${index + 1}`);
            run(options, ['wait', 'stable', '500', '8000']);
        } catch (error) {
            return {
                result: 'diverged',
                failedStep: index + 1,
                note: `step ${label}: ${formatReplayError(error)}`,
            };
        }
    }
    try {
        fs.mkdirSync(nodePath.dirname(arrivalImage), { recursive: true });
        screenshot(options, arrivalImage);
    } catch (error) {
        return {
            result: 'diverged',
            failedStep: null,
            note: `arrival screenshot: ${formatReplayError(error)}`,
        };
    }

    return { result: 'pass', failedStep: null, note: '' };
};
