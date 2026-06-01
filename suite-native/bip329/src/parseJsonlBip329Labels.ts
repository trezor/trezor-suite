import { type Bip329Label, bip329LabelSchema } from '@suite-common/bip329-types';
import { type Result, err, ok } from '@trezor/type-utils';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const parseJsonLine = (line: string): unknown | undefined => {
    try {
        return JSON.parse(line);
    } catch {
        return undefined;
    }
};

const validateLabel = (raw: Record<string, unknown>): Bip329Label | undefined =>
    bip329LabelSchema.isValidSync(raw, { strict: true })
        ? (bip329LabelSchema.cast(raw) as Bip329Label)
        : undefined;

export const parseJsonlBip329Labels = (content: string): Result<Bip329Label[], string> => {
    const lines = content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const labels: Bip329Label[] = [];

    for (const line of lines) {
        const raw = parseJsonLine(line);

        if (!isRecord(raw)) {
            return err('invalidBip329');
        }

        const label = validateLabel(raw);

        if (!label) {
            return err('invalidBip329');
        }

        labels.push(label);
    }

    return ok(labels);
};
