import { defineCapability, defineFamily } from './defineFamily';
import type { SuiteCommonNetworkConfig } from '../SuiteCommonNetworkConfig';
import type { OpenNetwork } from './defineFamily';
import type { FamilyMessageSigning, MessageSigning } from './messageSigning/MessageSigning';

type TestDeps = { getUrl: () => string };
type OtherDeps = { getOther: () => number };

declare const getConfig: (symbol: 'aaa' | 'taaa') => SuiteCommonNetworkConfig;
declare const messageSigning: FamilyMessageSigning<{ readonly format: 'a' | 'b' }>;

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

// A network the app resolved is open; narrowing it to its family brings the family's types back.
declare const resolved: OpenNetwork;
declare const base: Parameters<MessageSigning['sign']>[0];
// @ts-expect-error The open network does not know any family's parameters.
void resolved.capabilities.messageSigning?.signWithParams;
if (family.isOwnNetwork(resolved)) {
    const _family: 'test' = resolved.family;
    void resolved.capabilities.messageSigning?.signWithParams({ ...base, format: 'b' });
    // @ts-expect-error A value the family does not offer.
    void resolved.capabilities.messageSigning?.signWithParams({ ...base, format: 'c' });
    void _family;
}

void _closedSymbol;
void _optionalSigning;
void _wrongContract;
void _wrongDeps;
