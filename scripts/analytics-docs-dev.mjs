import { spawn } from 'node:child_process';

const procs = [];

const run = (name, args) => {
    const p = spawn('yarn', args, { stdio: 'inherit', shell: false });
    procs.push(p);

    p.on('exit', code => {
        if (code && code !== 0) {
            console.error(`[${name}] exited with code ${code}`);
        }
    });

    return p;
};

run('analytics-log-server', ['workspace', '@trezor/analytics-log-server', 'dev']);
run('analytics-docs', ['workspace', '@trezor/analytics-docs', 'dev']);

const shutdown = () => {
    for (const p of procs) {
        if (!p.killed) p.kill('SIGINT');
    }
};

process.on('SIGINT', () => {
    shutdown();
    process.exit(0);
});
process.on('SIGTERM', () => {
    shutdown();
    process.exit(0);
});
