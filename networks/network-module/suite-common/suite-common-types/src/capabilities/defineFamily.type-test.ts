import { defineCapability, defineFamily } from './defineFamily';
import type { SuiteCommonNetworkConfig } from '../SuiteCommonNetworkConfig';
import type { MessageSigning } from './messageSigning/MessageSigning';

type TestDeps = { getUrl: () => string };
type OtherDeps = { getOther: () => number };

declare const getConfig: (symbol: 'aaa' | 'taaa') => SuiteCommonNetworkConfig;
declare const messageSigning: MessageSigning;

const signing = defineCapability({
    requires: { feature: 'sign-verify' },
    create: (_deps: TestDeps) => messageSigning,
});

const family = defineFamily<TestDeps>()({
    family: 'test',
    symbols: ['aaa', 'taaa'] as const,
    getConfig,
    capabilities: { messageSigning: signing },
});

// The closed network keeps the literal symbol it was created for.
const _closedSymbol: 'aaa' = family.createNetwork(
    { getUrl: () => '' },
    {
        symbol: 'aaa',
        backend: 'blockbook',
    },
).symbol;

// Capabilities are optional: whether they exist depends on the context.
const _optionalSigning: MessageSigning | undefined = family.createNetwork(
    { getUrl: () => '' },
    { symbol: 'taaa', backend: 'blockbook' },
).capabilities.messageSigning;

const _wrongContract = defineFamily<TestDeps>()({
    family: 'test',
    symbols: ['aaa'] as const,
    getConfig,
    capabilities: {
        // @ts-expect-error A capability under a known name must match its open contract.
        messageSigning: defineCapability({ requires: {}, create: (_deps: TestDeps) => ({}) }),
    },
});

const _wrongDeps = defineFamily<TestDeps>()({
    family: 'test',
    symbols: ['aaa'] as const,
    getConfig,
    capabilities: {
        // @ts-expect-error Every provider must be satisfied by the family's dependencies.
        messageSigning: defineCapability({
            requires: {},
            create: (_deps: OtherDeps) => messageSigning,
        }),
    },
});

// @ts-expect-error A symbol of another family cannot be created.
family.createNetwork({ getUrl: () => '' }, { symbol: 'zzz', backend: 'blockbook' });

void _closedSymbol;
void _optionalSigning;
void _wrongContract;
void _wrongDeps;
