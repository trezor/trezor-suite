import { createExecCliCommand } from './execCliCommand';

const execCliCommand = createExecCliCommand({
    console: {
        log: jest.fn(),
    },
});

describe(execCliCommand.name, () => {
    it('captures stdout from a simple command', async () => {
        const result = await execCliCommand({ command: 'echo', args: ['hello world'] });

        expect(result.exitCode).toBe(0);
        expect(result.stdout.trim()).toBe('hello world');
        expect(result.stderr).toBe('');
    });

    it('returns non-zero exit code on failure', async () => {
        const result = await execCliCommand({ command: 'sh', args: ['-c', 'exit 42'] });

        expect(result.exitCode).toBe(42);
    });

    it('captures stderr', async () => {
        const result = await execCliCommand({
            command: 'sh',
            args: ['-c', 'echo oops >&2; exit 1'],
        });

        expect(result.exitCode).toBe(1);
        expect(result.stderr.trim()).toBe('oops');
    });

    it('respects cwd option', async () => {
        const result = await execCliCommand({ command: 'pwd', args: [], options: { cwd: '/tmp' } });

        expect(result.exitCode).toBe(0);
        // /tmp may resolve to a real path on some systems
        expect(result.stdout.trim()).toMatch(/\/tmp/);
    });

    it('times out long-running processes', async () => {
        const result = await execCliCommand({
            command: 'sleep',
            args: ['10'],
            options: { timeout: 100 },
        });

        expect(result.exitCode).toBe(124);
        expect(result.stderr).toContain('timed out');
    });

    it('does not timeout when process finishes within timeout', async () => {
        const result = await execCliCommand({
            command: 'sleep',
            args: ['1'],
            options: { timeout: 3000 },
        });

        expect(result.exitCode).toBe(0);
        expect(result.stderr).toBe('');
    });

    it('rejects when command does not exist', async () => {
        await expect(
            execCliCommand({ command: 'nonexistent-command-abc123', args: [] }),
        ).rejects.toThrow();
    });
});
