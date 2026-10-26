import {
    type GetNetworkDeps,
    asNetworkSymbol,
    createGetNetwork,
    createNetworkFamiliesCompositionRoot,
} from '@suite-common/networks';
import { messages } from '@suite-lego/intl';
import { asGetter, createMockDeps } from '@trezor/dependency-injection';
import type {
    Label,
    NetworkSuiteCommonModuleApi,
    OpenAccount,
} from '@trezor/network-module-suite-common-types';

import { isTranslationKey } from './CapabilityLabel';

const address = (path: string) => ({ path, address: path });

const createAccount = (symbol: string): OpenAccount => ({
    symbol: asNetworkSymbol(symbol),
    accountType: 'normal',
    index: 0,
    path: "m/0'/0'/0'",
    descriptor: 'descriptor',
    addresses: { unused: [address('m/0/2')], used: [address('m/0/1')], change: [address('m/1/0')] },
    misc: { staking: { address: 'stake' } },
});

// Every label the families hand to the UI, gathered the way the page reads them.
const getCapabilityLabels = (): Label[] => {
    const deps: GetNetworkDeps = {
        networkFamilies: createNetworkFamiliesCompositionRoot(
            createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
        ),
        getNetworkBackend: asGetter(() => 'blockbook'),
    };
    const getNetwork = createGetNetwork(deps);

    return ['btc', 'eth', 'ada'].flatMap(symbol => {
        const account = createAccount(symbol);
        const messageSigning = getNetwork({ symbol: account.symbol })?.capabilities.messageSigning;

        if (messageSigning === undefined) {
            throw new Error(`${symbol} is expected to sign messages.`);
        }

        const formatChoice = messageSigning.getFormatChoice(account);
        const groups = messageSigning.getSignAddressGroups({ account, touchedAddresses: [] });

        return [
            messageSigning.labels.title,
            ...(formatChoice
                ? [formatChoice.label, ...formatChoice.options.map(o => o.label)]
                : []),
            ...(formatChoice?.tooltip ? [formatChoice.tooltip] : []),
            ...groups.flatMap(group => (group.label ? [group.label] : [])),
        ];
    });
};

describe('capability labels', () => {
    it.each(getCapabilityLabels())(
        '$id is in the desktop catalog as the family wrote it',
        label => {
            expect(isTranslationKey(label.id)).toBe(true);
            expect(isTranslationKey(label.id) && messages[label.id].defaultMessage).toBe(
                label.defaultMessage,
            );
        },
    );
});
