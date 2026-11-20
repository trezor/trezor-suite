'use strict';

// Diagnostic preload: record process resources and child termination metadata only.
// Never log arguments, environment variables, or application data.
const childProcess = require('node:child_process');
const fs = require('node:fs');

const executableBasename = executable =>
    typeof executable === 'string' && !/\s/.test(executable)
        ? executable.split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 100)
        : 'shell-command';

const emit = (event, fields) => {
    try {
        fs.writeSync(
            2,
            `[ios-jest-diagnostics] ${JSON.stringify({
                time: new Date().toISOString(),
                event,
                pid: process.pid,
                ppid: process.ppid,
                ...fields,
            })}\n`,
        );
    } catch {
        // Diagnostics must not prevent the test process from continuing.
    }
};

const memory = () => {
    try {
        const { rss, heapUsed, heapTotal, external, arrayBuffers } = process.memoryUsage();

        return { rss, heapUsed, heapTotal, external, arrayBuffers };
    } catch {
        return {};
    }
};

emit('process-start', { executable: executableBasename(process.execPath), script: executableBasename(process.argv[1]), ...memory() });

const originalSpawn = childProcess.spawn;
childProcess.spawn = function (...args) {
    const child = Reflect.apply(originalSpawn, this, args);
    const executable = executableBasename(args[0]);

    emit('child-start', { childPid: child.pid ?? null, executable });
    child.once('exit', (code, signal) => {
        emit('child-exit', { childPid: child.pid ?? null, executable, code, signal });
    });

    return child;
};

const originalSpawnSync = childProcess.spawnSync;
childProcess.spawnSync = function (...args) {
    const result = Reflect.apply(originalSpawnSync, this, args);
    emit('sync-child-exit', { executable: executableBasename(args[0]), childPid: result.pid ?? null, code: result.status, signal: result.signal, errorCode: result.error?.code ?? null });

    return result;
};

const originalKill = process.kill;
process.kill = function (targetPid, signal) {
    emit('signal-send', { targetPid, signal: signal ?? 'SIGTERM' });

    return Reflect.apply(originalKill, this, arguments);
};

const memoryInterval = setInterval(() => emit('process-memory', memory()), 1_000);
memoryInterval.unref();

process.once('exit', code => emit('process-exit', { code, ...memory() }));
