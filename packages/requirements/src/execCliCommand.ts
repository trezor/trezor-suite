import { spawn } from 'node:child_process';

export type ExecResult = {
    readonly stdout: string;
    readonly stderr: string;
    readonly exitCode: number;
};

export type ExecOptions = {
    readonly cwd?: string;
    readonly env?: NodeJS.ProcessEnv;
    readonly timeout?: number;
};

export type ExecCliCommandParams = {
    readonly command: string;
    readonly args: ReadonlyArray<string>;
    readonly options?: ExecOptions;
};

export type ExecCliCommandDeps = {
    readonly console: Pick<Console, 'log'>;
};

export type ExecCliCommand = (params: ExecCliCommandParams) => Promise<ExecResult>;

export type ExecCliCommandDep = {
    readonly execCliCommand: ExecCliCommand;
};

export const createExecCliCommand =
    (deps: ExecCliCommandDeps): ExecCliCommand =>
    ({ command, args, options }) =>
        new Promise((resolve, reject) => {
            const cwd = options?.cwd ?? process.cwd();
            deps.console.log(`[requirements] exec: ${command} ${args.join(' ')} (cwd: ${cwd})`);

            const proc = spawn(command, [...args], {
                cwd: options?.cwd,
                env: options?.env ?? process.env,
                shell: false,
            });

            const stdoutChunks: Buffer[] = [];
            const stderrChunks: Buffer[] = [];

            proc.stdout.on('data', (chunk: Buffer) => {
                stdoutChunks.push(chunk);
            });

            proc.stderr.on('data', (chunk: Buffer) => {
                stderrChunks.push(chunk);
            });

            let timedOut = false;

            const timer =
                options?.timeout !== undefined
                    ? setTimeout(() => {
                          timedOut = true;
                          proc.kill('SIGTERM');
                      }, options.timeout)
                    : undefined;

            proc.on('error', error => {
                if (timer !== undefined) clearTimeout(timer);
                reject(error);
            });

            proc.on('close', exitCode => {
                if (timer !== undefined) clearTimeout(timer);

                const stdout = Buffer.concat(stdoutChunks).toString('utf-8');
                const stderr = Buffer.concat(stderrChunks).toString('utf-8');

                if (timedOut) {
                    resolve({ stdout, stderr: `${stderr}\nProcess timed out`, exitCode: 124 });
                } else {
                    resolve({ stdout, stderr, exitCode: exitCode ?? 1 });
                }
            });
        });
