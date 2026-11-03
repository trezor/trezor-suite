import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { redactTestEnvLog } from './redact-test-env-logs';

const PASSPHRASE = 'synth "pass" phrase\'s \\ příliš';
const LIVE_PASSPHRASE = 'synth-live-wallet-secret';
const PRIVATE_MNEMONIC = 'synthwordone synthwordtwo synthwordthree';
const scriptPath = path.join(__dirname, 'redact-test-env-logs.ts');
const toHex = (value: string) => Buffer.from(value, 'utf8').toString('hex');
const toHexBytes = (value: string) =>
    Array.from(Buffer.from(value, 'utf8'), byte => byte.toString(16)).join(', ');
const pythonQuote = (value: string) => value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");

const representations = [
    PASSPHRASE,
    pythonQuote(PASSPHRASE),
    JSON.stringify(PASSPHRASE).slice(1, -1),
    JSON.stringify(pythonQuote(PASSPHRASE)).slice(1, -1),
    PASSPHRASE.normalize('NFKD'),
    toHex(PASSPHRASE),
    toHex(PASSPHRASE).toUpperCase(),
    toHex(PASSPHRASE.normalize('NFKD')),
    toHexBytes(PASSPHRASE),
    toHexBytes(PASSPHRASE).replaceAll(', ', ','),
];

describe('redactTestEnvLog', () => {
    it.each(representations)('removes a supplied credential in representation %j', value => {
        const log = `trezor-user-env-unix-1 | diagnostic payload: ${value}`;

        expect(redactTestEnvLog(log, [PASSPHRASE])).toBe(
            'trezor-user-env-unix-1 | diagnostic payload: <redacted>',
        );
    });

    it('redacts credentials in protobuf dumps while preserving other fields', () => {
        const log = [
            'received message contents:',
            'PassphraseAck {',
            `    passphrase: '${pythonQuote(PASSPHRASE)}'`,
            '    on_device: False',
            '}',
        ];
        const expected = [...log];
        expected[2] = "    passphrase: '<redacted>'";

        for (const prefix of ['', 'trezor-user-env-unix-1 | ']) {
            expect(
                redactTestEnvLog(log.map(line => `${prefix}${line}`).join('\n'), [PASSPHRASE]),
            ).toBe(expected.map(line => `${prefix}${line}`).join('\n'));
        }
    });

    it('preserves public test data, protocol fields and error details', () => {
        const log = [
            "CONTROLLER: Request: {'type': 'emulator-setup', 'pin': '1234', 'label': 'E2E device', 'mnemonic': 'public test fixture'}",
            'GetPublicKey {',
            '    address_n: [2147483692, 2147483648]',
            '    show_display: True',
            '}',
            'RuntimeError: Unexpected response from emulator',
            'device_id: E2E_DEVICE_ID, session_id: TEST_SESSION',
            'code_entry_code: 739153, data_in=[73, 79, 6e]',
        ].join('\n');

        expect(redactTestEnvLog(log, [PASSPHRASE])).toBe(log);
    });

    it('handles multiple, overlapping credentials and literal regular-expression characters', () => {
        expect(
            redactTestEnvLog('synth-secret-long synth-secret a.*[b](c)?+$', [
                'synth-secret',
                'synth-secret-long',
                'a.*[b](c)?+$',
            ]),
        ).toBe('<redacted> <redacted> <redacted>');
    });

    it('keeps logs unchanged when no nonempty credentials are supplied', () => {
        expect(redactTestEnvLog('public test log', ['', ''])).toBe('public test log');
    });
});

describe('redact-test-env-logs CLI', () => {
    let logsDir: string;

    beforeEach(() => {
        logsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-env-logs-'));
    });

    afterEach(() => {
        fs.rmSync(logsDir, { recursive: true, force: true });
    });

    it('redacts copied logs and Docker stdout using both CI wallet passphrases', () => {
        const fileNames = [
            'trezor-user-env-debugging.log',
            'trezor-user-env-unix.log',
            'tenv-emulator-bridge-debugging.log',
            'trezor-user-env-tropic_model.log',
        ];
        const log = [...representations, LIVE_PASSPHRASE, toHex(LIVE_PASSPHRASE)].join('\n');
        fileNames.forEach(fileName => fs.writeFileSync(path.join(logsDir, fileName), log));

        const result = spawnSync(process.execPath, [scriptPath, logsDir], {
            encoding: 'utf8',
            env: {
                ...process.env,
                TEST_ENV_LOG_PASSPHRASE: PASSPHRASE,
                TEST_ENV_LOG_PASSPHRASE_LIVE: LIVE_PASSPHRASE,
            },
        });

        expect(result.stderr).toBe('');
        expect(result.status).toBe(0);
        fileNames.forEach(fileName => {
            expect(fs.readFileSync(path.join(logsDir, fileName), 'utf8')).toBe(
                Array.from({ length: representations.length + 2 }, () => '<redacted>').join('\n'),
            );
        });
    });

    it('redacts an explicitly supplied private mnemonic, including individual backup words', () => {
        const filePath = path.join(logsDir, 'debugging.log');
        fs.writeFileSync(filePath, PRIVATE_MNEMONIC.split(' ').join('\n'));

        const result = spawnSync(process.execPath, [scriptPath, logsDir], {
            encoding: 'utf8',
            env: { ...process.env, TEST_ENV_LOG_MNEMONIC: PRIVATE_MNEMONIC },
        });

        expect(result.status).toBe(0);
        expect(fs.readFileSync(filePath, 'utf8')).toBe('<redacted>\n<redacted>\n<redacted>');
    });

    it.each(['directory', 'symlink'])('fails on an unexpected %s before upload', fileType => {
        const entryPath = path.join(logsDir, 'unexpected-entry');
        if (fileType === 'directory') {
            fs.mkdirSync(entryPath);
        } else {
            fs.symlinkSync(scriptPath, entryPath);
        }

        const result = spawnSync(process.execPath, [scriptPath, logsDir], { encoding: 'utf8' });

        expect(result.status).not.toBe(0);
    });

    it('does not silently skip redaction when invoked through a symlink', () => {
        const linkPath = path.join(logsDir, 'redactor.ts');
        fs.symlinkSync(scriptPath, linkPath);
        const outputDirectory = path.join(logsDir, 'logs');
        fs.mkdirSync(outputDirectory);
        const filePath = path.join(outputDirectory, 'debugging.log');
        fs.writeFileSync(filePath, LIVE_PASSPHRASE);

        const result = spawnSync(
            process.execPath,
            ['--preserve-symlinks-main', linkPath, outputDirectory],
            {
                encoding: 'utf8',
                env: { ...process.env, TEST_ENV_LOG_PASSPHRASE: LIVE_PASSPHRASE },
            },
        );

        expect(result.status).toBe(0);
        expect(fs.readFileSync(filePath, 'utf8')).toBe('<redacted>');
    });
});
