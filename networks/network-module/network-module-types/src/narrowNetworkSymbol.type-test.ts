import {
    createNarrow,
    createNarrowAsync,
    createNarrowComponent,
    isSupportedNetworkSymbol,
    narrowNetworkSymbol,
} from './narrowNetworkSymbol';
import { type NetworkSymbol, asNetworkSymbol } from './networkSymbol';

const supportedTestNetworks = ['aaa', 'taaa'] as const;
type TestNetworkSymbol = (typeof supportedTestNetworks)[number];

declare const openSymbol: NetworkSymbol;
declare const rawSymbol: string;

// --- isSupportedNetworkSymbol ---

if (isSupportedNetworkSymbol(supportedTestNetworks, rawSymbol)) {
    const guarded: TestNetworkSymbol = rawSymbol;
    void guarded;
}

// @ts-expect-error without the guard the symbol stays open
const unguarded: TestNetworkSymbol = rawSymbol;

// --- narrowNetworkSymbol ---

const narrowed = narrowNetworkSymbol(supportedTestNetworks, openSymbol);

// The result keeps the brand, so it still fits APIs that take the open symbol.
const narrowedClosed: TestNetworkSymbol = narrowed;
const narrowedOpen: NetworkSymbol = narrowed;

// @ts-expect-error only branded symbols are narrowed
narrowNetworkSymbol(supportedTestNetworks, rawSymbol);

// @ts-expect-error the result is limited to the supported list
const narrowedForeign: 'zzz' = narrowNetworkSymbol(supportedTestNetworks, openSymbol);

// --- createNarrow ---

const narrow = createNarrow(supportedTestNetworks);

declare const getLabel: (symbol: TestNetworkSymbol, index: number) => string;

const getOpenLabel = narrow(getLabel);

const label: string = getOpenLabel(openSymbol, 0);
const labelFromBranded: string = getOpenLabel(asNetworkSymbol('aaa'), 0);

// @ts-expect-error the wrapped function takes the open branded symbol, not any string
getOpenLabel(rawSymbol, 0);

// @ts-expect-error the remaining arguments keep their types
getOpenLabel(openSymbol, '0');

// @ts-expect-error the remaining arguments stay required
getOpenLabel(openSymbol);

// @ts-expect-error the result type is preserved
const labelAsNumber: number = getOpenLabel(openSymbol, 0);

declare const getForeignLabel: (symbol: 'zzz') => string;

// @ts-expect-error a function for another network cannot be narrowed by this list
narrow(getForeignLabel);

// --- createNarrowAsync ---

const narrowAsync = createNarrowAsync(supportedTestNetworks);

declare const resolveLabel: (symbol: TestNetworkSymbol, index: number) => Promise<string>;

const resolveOpenLabel = narrowAsync(resolveLabel);

const resolvedLabel: Promise<string> = resolveOpenLabel(openSymbol, 0);

// @ts-expect-error the wrapped function takes the open branded symbol, not any string
resolveOpenLabel(rawSymbol, 0);

// @ts-expect-error the remaining arguments keep their types
resolveOpenLabel(openSymbol, '0');

// @ts-expect-error the result type is preserved
const resolvedLabelAsNumber: Promise<number> = resolveOpenLabel(openSymbol, 0);

// @ts-expect-error only functions returning a promise can be narrowed asynchronously
narrowAsync(getLabel);

declare const resolveForeignLabel: (symbol: 'zzz') => Promise<string>;

// @ts-expect-error a function for another network cannot be narrowed by this list
narrowAsync(resolveForeignLabel);

// --- createNarrowComponent ---

const narrowComponent = createNarrowComponent(supportedTestNetworks);

type LabelProps<TNetworkSymbol extends string> = {
    networkSymbol: NetworkSymbol & TNetworkSymbol;
    index: number;
};
type LabelComponent<TNetworkSymbol extends string> = (props: LabelProps<TNetworkSymbol>) => string;

declare const Label: LabelComponent<TestNetworkSymbol>;

// The shared layer renders it with the open symbol; the network component sees its closed one.
const OpenLabel: LabelComponent<NetworkSymbol> = narrowComponent(Label);

const componentLabel: string = OpenLabel({ networkSymbol: openSymbol, index: 0 });

// @ts-expect-error the other props keep their types
OpenLabel({ networkSymbol: openSymbol, index: '0' });

// @ts-expect-error the other props stay required
OpenLabel({ networkSymbol: openSymbol });

declare const ForeignLabel: LabelComponent<'zzz'>;

const OpenForeignLabel: LabelComponent<NetworkSymbol> = narrowComponent(
    // @ts-expect-error a component for another network cannot be narrowed by this list
    ForeignLabel,
);

void unguarded;
void narrowedClosed;
void narrowedOpen;
void narrowedForeign;
void label;
void labelFromBranded;
void labelAsNumber;
void componentLabel;
void OpenForeignLabel;
void resolvedLabel;
void resolvedLabelAsNumber;
