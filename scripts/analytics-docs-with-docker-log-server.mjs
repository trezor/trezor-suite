import { spawn } from 'node:child_process';

const run = (name, cmd, args, { stdio = 'inherit', shell = false } = {}) => {
    const p = spawn(cmd, args, { stdio, shell });
    p.on('exit', code => {
        if (code && code !== 0) {
            console.error(`[${name}] exited with code ${code}`);
        }
    });

    return p;
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const runAndWait = (name, cmd, args, { stdio = 'ignore', shell = false } = {}) =>
    new Promise(resolve => {
        const p = spawn(cmd, args, { stdio, shell });
        p.on('exit', () => resolve());
    });

const httpStatus = async url => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    try {
        const res = await fetch(url, { signal: ctrl.signal });

        return res.status;
    } catch {
        return null;
    } finally {
        clearTimeout(t);
    }
};

const image = process.env.ANALYTICS_LOG_SERVER_IMAGE ?? 'analytics-log-server';
const containerName = process.env.ANALYTICS_LOG_SERVER_CONTAINER ?? 'analytics-log-server-dev';
const logServerPort = Number(process.env.ANALYTICS_LOG_SERVER_PORT ?? 5181);
const docsPort = Number(process.env.ANALYTICS_DOCS_PORT ?? 5180);
const skipBuild = process.env.SKIP_DOCKER_BUILD === '1';

const dockerBuild = async () => {
    if (skipBuild) return;
    console.warn(`[docker] building image ${image}...`);
    await new Promise((resolve, reject) => {
        const p = run(
            'docker-build',
            'docker',
            ['build', '-f', 'packages/analytics-log-server/Dockerfile', '-t', image, '.'],
            { shell: false },
        );
        p.on('exit', code => {
            if (code === 0) resolve();
            else reject(new Error(`docker build failed with code ${code}`));
        });
    });
};

const dockerRun = async () => {
    // Stop/remove container if it already exists.
    await new Promise(resolve => {
        run('docker-rm', 'docker', ['rm', '-f', containerName], { stdio: 'ignore' }).on(
            'exit',
            () => resolve(),
        );
    });

    // eslint-disable-next-line no-console
    console.log(`[docker] starting container ${containerName} on :${logServerPort}...`);
    const id = await new Promise((resolve, reject) => {
        const p = spawn(
            'docker',
            [
                'run',
                '-d',
                '--name',
                containerName,
                '-p',
                `${logServerPort}:${logServerPort}`,
                '-e',
                `PORT=${logServerPort}`,
                image,
            ],
            { stdio: ['ignore', 'pipe', 'inherit'] },
        );

        let out = '';
        p.stdout.on('data', d => {
            out += d.toString('utf8');
        });
        p.on('exit', code => {
            if (code === 0) resolve(out.trim());
            else reject(new Error(`docker run failed with code ${code}`));
        });
    });

    return id;
};

const cleanup = async () => {
    try {
        await runAndWait('docker-stop', 'docker', ['stop', containerName]);
    } catch {
        // ignore
    }
    try {
        await runAndWait('docker-rm', 'docker', ['rm', '-f', containerName]);
    } catch {
        // ignore
    }
};

process.on('SIGINT', async () => {
    await cleanup();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
});

await dockerBuild();
await dockerRun();

// Wait until server responds.
const healthUrl = `http://127.0.0.1:${logServerPort}/api/health`;
console.warn(`[health] waiting for ${healthUrl}...`);
for (let i = 0; i < 30; i += 1) {
    const status = await httpStatus(healthUrl);
    if (status === 200) break;
    await sleep(500);
    if (i === 29) {
        console.warn('[health] server did not become ready in time');
    }
}

run('analytics-docs', 'yarn', [
    'workspace',
    '@trezor/analytics-docs',
    'dev',
    '--',
    '--port',
    String(docsPort),
    '--strictPort',
]);
