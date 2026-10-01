import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const staleMonitor = require('./stale-monitor.cjs');

const originalEnv = process.env;

const createDependencies = () => ({
    github: {
        paginate: async (_, params) => (params.state === 'open' ? [] : []),
        rest: {
            pulls: {
                list: () => {},
            },
            issues: {
                listForRepo: () => {},
            },
        },
    },
    context: {
        repo: {
            owner: 'trezor',
            repo: 'trezor-suite',
        },
    },
    core: {
        infoCalls: [],
        failedCalls: [],
        info(message) {
            this.infoCalls.push(message);
        },
        setFailed(message) {
            this.failedCalls.push(message);
        },
    },
});

test('accepts SLACK_WEBHOOK_URL from the workflow environment', async () => {
    const fetchCalls = [];
    process.env = {
        ...originalEnv,
        TARGET_OWNER: 'trezor',
        TARGET_REPO: 'trezor-suite',
        STALE_DAYS: '2',
        SLACK_WEBHOOK_URL: 'https://example.com/slack-webhook',
    };
    global.fetch = async (...args) => {
        fetchCalls.push(args);

        return {
            ok: true,
            text: async () => '',
        };
    };

    try {
        const { github, context, core } = createDependencies();

        await staleMonitor({ github, context, core });

        assert.deepEqual(core.failedCalls, []);
        assert.equal(fetchCalls.length, 1);
        assert.equal(fetchCalls[0][0], 'https://example.com/slack-webhook');
        assert.equal(fetchCalls[0][1].method, 'POST');
        assert.deepEqual(fetchCalls[0][1].headers, { 'Content-Type': 'application/json' });
        assert.equal(typeof fetchCalls[0][1].body, 'string');
    } finally {
        process.env = originalEnv;
        delete global.fetch;
    }
});

test('fails when no supported Slack webhook env var is set', async () => {
    process.env = {
        ...originalEnv,
        TARGET_OWNER: 'trezor',
        TARGET_REPO: 'trezor-suite',
        STALE_DAYS: '2',
    };

    const fetchCalls = [];
    global.fetch = async (...args) => {
        fetchCalls.push(args);

        return {
            ok: true,
            text: async () => '',
        };
    };

    try {
        const { github, context, core } = createDependencies();

        await staleMonitor({ github, context, core });

        assert.deepEqual(core.failedCalls, ['Slack webhook secret is not set.']);
        assert.equal(fetchCalls.length, 0);
    } finally {
        process.env = originalEnv;
        delete global.fetch;
    }
});
