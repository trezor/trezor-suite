import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import type { AddressValidator } from './AddressValidator';
import type { NetworkIcon } from './NetworkIcon';
import type { NamedAddressResolver } from './NamedAddressResolver';
import type { SuiteCommonNetworkConfig } from './SuiteCommonNetworkConfig';
import type { SuiteCommonNetworkModule } from './SuiteCommonNetworkModule';
import { createNetworkModule } from './createNetworkModule';

// A stand-in for a network package's closed symbol type, so this package stays independent of
// any particular network.
const supportedTestNetworks = ['aaa', 'taaa'] as const;
type TestNetworkSymbol = (typeof supportedTestNetworks)[number];
type ForeignNetworkSymbol = 'zzz';

declare const icon: NetworkIcon<TestNetworkSymbol>;
declare const networkConfig: SuiteCommonNetworkConfig;
declare const addressValidator: AddressValidator<TestNetworkSymbol>;
declare const namedAddressResolver: NamedAddressResolver<TestNetworkSymbol>;
declare const foreignAddressValidator: AddressValidator<ForeignNetworkSymbol>;
declare const getAccountSyncInterval: (symbol: TestNetworkSymbol) => number;
declare const getNetworkConfig: (symbol: TestNetworkSymbol) => SuiteCommonNetworkConfig;

// The module a shared layer sees speaks the open symbol, whatever the closed one was.
const _module: SuiteCommonNetworkModule = createNetworkModule(supportedTestNetworks, {
    icon,
    addressValidator,
    namedAddressResolver,
    getNetworkConfig,
    getAccountSyncInterval,
});

// A name system is optional.
const _withoutNamedAddresses: SuiteCommonNetworkModule = createNetworkModule(
    supportedTestNetworks,
    {
        icon,
        addressValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    },
);

// The capabilities are written against the closed symbol: no conversion at the call site.
const _closedSymbolConfig: SuiteCommonNetworkConfig = getNetworkConfig('aaa');

// --- the definition is bound to the symbols the list declares ---

const _foreignValidator = createNetworkModule(supportedTestNetworks, {
    icon,
    // @ts-expect-error a validator for another network cannot serve this module
    addressValidator: foreignAddressValidator,
    getNetworkConfig,
    getAccountSyncInterval,
});

const _foreignList = createNetworkModule(
    // @ts-expect-error the capabilities do not cover the networks this list declares
    ['zzz'] as const,
    {
        icon,
        addressValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    },
);

// A config lookup narrower than the supported network list is rejected.
const _narrowNetworkConfig = createNetworkModule(supportedTestNetworks, {
    icon,
    addressValidator,
    // @ts-expect-error the config lookup must accept every symbol the list declares
    getNetworkConfig: (_symbol: 'aaa') => networkConfig,
    getAccountSyncInterval,
});

// --- the returned module takes the open symbol, and only the open symbol ---

const _fromOpenSymbol: SuiteCommonNetworkConfig = _module.getNetworkConfig(asNetworkSymbol('aaa'));

// An unrecognized symbol is a runtime concern, not a type error: the open symbol admits it and
// the module rejects it at its edge.
const _fromUnknownSymbol: SuiteCommonNetworkConfig = _module.getNetworkConfig(
    asNetworkSymbol('unknown-network'),
);

// @ts-expect-error an unbranded string is not a network symbol
_module.getNetworkConfig('aaa');

const _supportedNetworks: readonly NetworkSymbol[] = _module.getSupportedNetworks();

const _interval: number = _module.getAccountSyncInterval(asNetworkSymbol('aaa'));

// @ts-expect-error An unbranded string is not a network symbol.
_module.getAccountSyncInterval('aaa');

void _interval;
void _module;
void _withoutNamedAddresses;
void _closedSymbolConfig;
void _foreignValidator;
void _foreignList;
void _narrowNetworkConfig;
void _fromOpenSymbol;
void _fromUnknownSymbol;
void _supportedNetworks;
