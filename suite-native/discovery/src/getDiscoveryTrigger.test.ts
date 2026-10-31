import { type UnknownAction } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { accountsActions, changeCoinVisibilityThunk } from '@suite-common/wallet-core';
import { type DiscoveryTrigger } from '@suite-common/wallet-types';
import { createAndBackupWalletThunk, recoverWalletThunk } from '@suite-native/device';
import { DEVICE } from '@trezor/connect';

import { getDiscoveryTrigger } from './getDiscoveryTrigger';

type Fixture = {
    description: string;
    action: UnknownAction;
    expectedTrigger: DiscoveryTrigger | undefined;
};

const fixtures: Fixture[] = [
    {
        description: 'device connected',
        action: { type: DEVICE.CONNECT },
        expectedTrigger: 'device-connect',
    },
    {
        description: 'device selected',
        action: { type: deviceActions.selectDevice.type },
        expectedTrigger: 'device-switch',
    },
    {
        description: 'coin visibility changed',
        action: { type: changeCoinVisibilityThunk.fulfilled.type },
        expectedTrigger: 'coin-toggle',
    },
    {
        description: 'firmware authenticity check dismissed',
        action: { type: deviceActions.dismissFirmwareAuthenticityCheck.type },
        expectedTrigger: 'device-check',
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
        description: 'wallet created and backed up',
        action: { type: createAndBackupWalletThunk.fulfilled.type },
        expectedTrigger: 'onboarding',
    },
    {
        description: 'wallet recovered',
        action: { type: recoverWalletThunk.fulfilled.type },
        expectedTrigger: 'onboarding',
    },
    {
        description: 'discovery entropy check dismissed',
        action: { type: deviceActions.dismissDiscoveryEntropyCheck.type },
        expectedTrigger: undefined,
    },
    {
        description: 'unrelated action',
        action: { type: 'foo' },
        expectedTrigger: undefined,
    },
];

describe(getDiscoveryTrigger.name, () => {
    it.each(fixtures)('maps $description', ({ action, expectedTrigger }) => {
        expect(getDiscoveryTrigger(action)).toBe(expectedTrigger);
    });
});
