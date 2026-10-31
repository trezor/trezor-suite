import { type UnknownAction } from 'redux';

import { routerAppChanged } from '@suite/router';
import { connectPopupCallInnerThunk } from '@suite-common/connect-popup';
import { deviceActions } from '@suite-common/device';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { thpActions } from '@suite-common/thp';
import { accountsActions, changeNetworks } from '@suite-common/wallet-core';
import { type DiscoveryTrigger } from '@suite-common/wallet-types';

import { getDiscoveryTrigger } from './getDiscoveryTrigger';

type Fixture = {
    description: string;
    action: UnknownAction;
    expectedTrigger: DiscoveryTrigger | undefined;
};

const unrelatedAction: UnknownAction = { type: 'foo' };

const fixtures: Fixture[] = [
    {
        description: 'THP autoconnect finished',
        action: thpActions.finishAutoconnectFlow(),
        expectedTrigger: 'device-connect',
    },
    {
        description: 'device selected',
        action: { type: deviceActions.selectDevice.type },
        expectedTrigger: 'device-switch',
    },
    {
        description: 'router app changed',
        action: routerAppChanged('dashboard'),
        expectedTrigger: 'resume',
    },
    {
        description: 'connect popup call finished',
        action: { type: connectPopupCallInnerThunk.fulfilled.type },
        expectedTrigger: 'resume',
    },
    {
        description: 'firmware authenticity check dismissed',
        action: { type: deviceActions.dismissFirmwareAuthenticityCheck.type },
        expectedTrigger: 'device-check',
    },
    {
        description: 'manual device check succeeded',
        action: { type: persistentDeviceDataActions.setManualDeviceCheckSuccess.type },
        expectedTrigger: 'device-check',
    },
    {
        description: 'device authenticity result stored',
        action: { type: persistentDeviceDataActions.setDeviceAuthenticityResult.type },
        expectedTrigger: 'device-check',
    },
    {
        description: 'enabled networks changed',
        action: { type: changeNetworks.type },
        expectedTrigger: 'coin-toggle',
    },
    {
        description: 'account updated',
        action: { type: accountsActions.updateAccount.type },
        expectedTrigger: 'account-update',
    },
    {
        description: 'account visibility changed',
        action: { type: accountsActions.changeAccountVisibility.type },
        expectedTrigger: 'account-update',
    },
    {
        description: 'discovery entropy check dismissed',
        action: { type: deviceActions.dismissDiscoveryEntropyCheck.type },
        expectedTrigger: undefined,
    },
    {
        description: 'unrelated action',
        action: unrelatedAction,
        expectedTrigger: undefined,
    },
];

describe(getDiscoveryTrigger.name, () => {
    it.each(fixtures)('maps $description', ({ action, expectedTrigger }) => {
        expect(
            getDiscoveryTrigger({
                action,
                isDeviceBecomingAcquired: false,
                isDeviceBecomingConnected: false,
            }),
        ).toBe(expectedTrigger);
    });

    it('maps a device becoming acquired or connected regardless of the action', () => {
        expect(
            getDiscoveryTrigger({
                action: unrelatedAction,
                isDeviceBecomingAcquired: true,
                isDeviceBecomingConnected: false,
            }),
        ).toBe('device-connect');
        expect(
            getDiscoveryTrigger({
                action: unrelatedAction,
                isDeviceBecomingAcquired: false,
                isDeviceBecomingConnected: true,
            }),
        ).toBe('device-connect');
    });
});
