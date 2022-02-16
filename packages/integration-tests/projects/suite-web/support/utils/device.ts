/* eslint-disable @typescript-eslint/naming-convention */

import { DEVICE, Features, Device } from 'trezor-connect';
import {
    getConnectDevice,
    getDeviceFeatures,
} from '../../../../../suite/src/support/tests/setupJest';

/**
 * Helper method to dispatch DEVICE.CONNECT action.
 *
 * @param device
 * @param features
 */

export const connectDevice = (device?: Partial<Device>, features?: Partial<Features>) =>
    cy
        .window()
        .its('store')
        .invoke('dispatch', {
            type: DEVICE.CONNECT,
            payload: getConnectDevice(device, getDeviceFeatures(features)),
        });

export const connectBootloaderDevice = (path: string) =>
    cy
        .window()
        .its('store')
        .invoke('dispatch', {
            type: DEVICE.CONNECT,
            payload: {
                available: true,
                connected: true,
                features: {
                    bootloader_hash: null,
                    bootloader_mode: true,
                    capabilities: [],
                    device_id: null,
                    firmware_present: true,
                    flags: null,
                    fw_major: null,
                    fw_minor: null,
                    fw_patch: null,
                    fw_vendor: null,
                    imported: null,
                    initialized: null,
                    label: null,
                    language: null,
                    major_version: 1,
                    minor_version: 8,
                    model: null,
                    needs_backup: null,
                    no_backup: null,
                    passphrase_protection: null,
                    patch_version: 0,
                    pin_protection: null,
                    recovery_mode: null,
                    revision: null,
                    unfinished_backup: null,
                    vendor: 'trezor.io',
                },
                firmware: 'unknown',
                instance: undefined,
                label: 'My Trezor',
                mode: 'bootloader',
                path,
                remember: false,
                state: undefined,
                status: 'available',
                ts: 1571063674671,
                type: 'acquired',
                useEmptyPassphrase: true,
            },
        });
/**
 * Helper method to dispatch DEVICE.CHANGED action.
 *
 * @param path
 * @param device
 * @param features
 */
export const changeDevice = (
    path: string,
    device?: Partial<Device>,
    features?: Partial<Features>,
) => {
    cy.window()
        .its('store')
        .invoke('dispatch', {
            type: DEVICE.CHANGED,
            payload: getConnectDevice({ ...device, path }, getDeviceFeatures(features)),
        });
    return cy;
};
