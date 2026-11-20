// Only caller-supplied wallet credentials are redacted. Public test mnemonics, PINs, device
// identifiers and protocol payloads remain available for debugging.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const getSecretRepresentations = (secret: string): string[] => {
    const representations = new Set<string>();

    // BIP39 normalizes passphrases; logs may contain either the input or the normalized value.
    for (const value of new Set([secret, secret.normalize('NFKD')])) {
        const textRepresentations = new Set([value]);

        // A request can be quoted again inside its response, so cover two levels of escaping.
        for (let depth = 0; depth < 2; depth++) {
            for (const text of [...textRepresentations]) {
                const escaped = text
                    .replaceAll('\\', '\\\\')
                    .replaceAll('\r', '\\r')
                    .replaceAll('\n', '\\n')
                    .replaceAll('\t', '\\t');
                textRepresentations.add(escaped.replaceAll("'", "\\'"));
                textRepresentations.add(escaped.replaceAll('"', '\\"'));
                textRepresentations.add(JSON.stringify(text).slice(1, -1));
            }
        }
        textRepresentations.forEach(text => representations.add(text));

        const bytes = Buffer.from(value, 'utf8');
        representations.add(bytes.toString('hex'));
        representations.add(bytes.toString('hex').toUpperCase());
        // Firmware/bridge buffers use hex; the Tropic model prints comma-separated hex bytes.
        for (const width of [1, 2]) {
            const hexBytes = Array.from(bytes, byte => byte.toString(16).padStart(width, '0'));
            representations.add(hexBytes.join(', '));
            representations.add(hexBytes.join(','));
        }
    }

    return [...representations];
};

export const redactTestEnvLog = (log: string, secrets: readonly string[]): string => {
    const representations = [...new Set(secrets.filter(Boolean).flatMap(getSecretRepresentations))];
    if (representations.length === 0) return log;

    // Match longest first, and replace in one pass so overlapping secrets cannot expose a suffix.
    const pattern = representations
        .toSorted((first, second) => second.length - first.length)
        .map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');

    return log.replace(new RegExp(pattern, 'g'), '<redacted>');
};

const redactTestEnvLogFiles = (logsDir: string): void => {
    const mnemonic = process.env.TEST_ENV_LOG_MNEMONIC ?? '';
    const secrets = [
        process.env.TEST_ENV_LOG_PASSPHRASE ?? '',
        process.env.TEST_ENV_LOG_PASSPHRASE_LIVE ?? '',
        mnemonic,
        // A private mnemonic can also appear one word at a time in backup/recovery output.
        ...mnemonic.split(/\s+/),
    ];

    for (const file of fs.readdirSync(logsDir, { withFileTypes: true })) {
        if (!file.isFile()) {
            throw new Error('Expected regular log files.');
        }

        const logPath = path.join(logsDir, file.name);
        fs.writeFileSync(logPath, redactTestEnvLog(fs.readFileSync(logPath, 'utf8'), secrets));
    }
};

// Resolve symlinks on both sides so CLI detection cannot silently skip redaction.
if (
    process.argv[1] &&
    fs.realpathSync(fileURLToPath(import.meta.url)) === fs.realpathSync(process.argv[1])
) {
    const [logsDir] = process.argv.slice(2);
    if (!logsDir) {
        throw new Error('Usage: node ./scripts/ci/redact-test-env-logs.ts <logsDir>');
    }
    redactTestEnvLogFiles(logsDir);
}
