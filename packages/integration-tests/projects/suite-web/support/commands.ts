/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-var-requires */

import TrezorConnect, { Device, Features } from '@trezor/connect';
import 'cypress-wait-until';
import { Store, Action } from '@suite-types';

import {
    onboardingShouldLoad,
    dashboardShouldLoad,
    discoveryShouldFinish,
} from './utils/assertions';
import { connectBootloaderDevice, connectDevice, changeDevice } from './utils/device';
import { getTestElement, getConfirmActionOnDeviceModal, hoverTestElement } from './utils/selectors';
import { resetDb, dispatch } from './utils/test-env';
import {
    toggleDeviceMenu,
    toggleDebugModeInSettings,
    passThroughInitialRun,
    passThroughBackup,
    passThroughBackupShamir,
    passThroughInitMetadata,
    passThroughSetPin,
    enableRegtestAndGetCoins,
    createAccountFromMyAccounts,
} from './utils/shortcuts';

const command = require('cypress-image-snapshot/command');
const { skipOn, onlyOn } = require('@cypress/skip-test');

const prefixedVisit = (route: string, options?: Partial<Cypress.VisitOptions>) => {
    const baseUrl = Cypress.config('baseUrl');
    const assetPrefix = Cypress.env('ASSET_PREFIX') || '';
    const testUrl = Cypress.env('TEST_URLS')?.[0] || '';

    cy.visit(baseUrl + testUrl + assetPrefix + route, options);
    return cy.document().its('fonts.status').should('equal', 'loaded');
};

beforeEach(() => {
    const suiteName = (Cypress as any).mocha.getRunner().suite.ctx.currentTest.parent.title;
    const testName = (Cypress as any).mocha.getRunner().suite.ctx.currentTest.title;
    cy.task('trezorUserEnvConnect');
    cy.task('logTestDetails', `New test case: ${suiteName} - ${testName}`);
    cy.task('resetCRI');

    cy.intercept('*', { hostname: '127.0.0.1' }, req => {
        req.url = req.url.replace('21325', '21326');
    });

    // disable messaging system on develop
    cy.intercept('https://data.trezor.io/config/develop/config.v1.jws', req => {
        const mock =
            'eyJhbGciOiJFUzI1NiJ9.ewogICAgInZlcnNpb24iOiAxLAogICAgInRpbWVzdGFtcCI6ICIyMDIyLTA0LTA0VDAwOjAwOjAwKzAwOjAwIiwKICAgICJzZXF1ZW5jZSI6IDEwMCwKICAgICJhY3Rpb25zIjogW10KfQo.6LBUsZIxdDGLxVuHQNvFmphVdRwxMpmEHhRC-vU4horpzWwIlvex8R7w48YInk231OxxovrHX8pVvCDWPaoWRA';
        req.continue(res => {
            res.send(mock);
        });
    });

    // disable messaging system in codesign build
    cy.intercept('https://data.trezor.io/config/stable/config.v1.jws', req => {
        const mock =
            'eyJhbGciOiJFUzI1NiJ9.ewogICAgInZlcnNpb24iOiAxLAogICAgInRpbWVzdGFtcCI6ICIyMDIyLTA0LTA0VDAwOjAwOjAwKzAwOjAwIiwKICAgICJzZXF1ZW5jZSI6IDEwMCwKICAgICJhY3Rpb25zIjogW10KfQo.rM_IWzbu3iRelYC9fB7YA3sHtCWXTJAKTgxJ5WszUj__BTEIvBbd5iBFSaDoNrY4CZejxNCbnzMTLnb5x6ZN2A';
        req.continue(res => {
            res.send(mock);
        });
    });

    cy.visit('/');
    cy.log('stop and start bridge before every test to make sure that there is no pending session');
    cy.task('stopBridge');
    cy.task('stopEmu');
});

afterEach(() => {
    cy.task('trezorUserEnvDisconnect');
});

declare global {
    namespace Cypress {
        interface Chainable<Subject> {
            getTestElement: typeof getTestElement;
            hoverTestElement: typeof hoverTestElement;
            prefixedVisit: typeof prefixedVisit;
            getConfirmActionOnDeviceModal: typeof getConfirmActionOnDeviceModal;
            resetDb: typeof resetDb;
            // todo: better types, this is not 100% correct as this fn may get more args from
            // cypress-image-snapshot lib
            matchImageSnapshot: typeof cy['screenshot'];
            connectDevice: (
                device?: Partial<Device>,
                features?: Partial<Features>,
            ) => Chainable<any>;
            connectBootloaderDevice: (path: string) => Chainable<any>;
            changeDevice: (
                path: string,
                device?: Partial<Device>,
                features?: Partial<Features>,
            ) => Chainable<any>;
            dispatch: (state: Action) => undefined;
            onboardingShouldLoad: () => Chainable<Subject>;
            dashboardShouldLoad: () => Chainable<Subject>;
            discoveryShouldFinish: () => Chainable<Subject>;
            toggleDeviceMenu: () => Chainable<Subject>;
            toggleDebugModeInSettings: () => Chainable<Subject>;
            text: () => Chainable<Subject>;
            passThroughInitialRun: () => Chainable<Subject>;
            passThroughBackup: () => Chainable<Subject>;
            passThroughBackupShamir: (shares: number, threshold: number) => Chainable<Subject>;
            passThroughSetPin: () => Chainable<Subject>;
            passThroughInitMetadata: (provider: 'dropbox' | 'google') => Chainable<Subject>;
            enableRegtestAndGetCoins: (params: {
                payments: { address: string; amount: number }[];
            }) => Chainable<Subject>;
            skipOn: (nameOrFlag: string | boolean, cb?: () => void) => Cypress.Chainable<any>;
            onlyOn: (nameOrFlag: string | boolean, cb?: () => void) => Cypress.Chainable<any>;
            createAccountFromMyAccounts: (
                coin: string,
                accountNameAdd: string,
            ) => Chainable<Subject>;
        }
    }
}

declare global {
    interface Window {
        store: Store;
        TrezorConnect: typeof TrezorConnect;
    }
}

if (Cypress.env('SNAPSHOT')) {
    command.addMatchImageSnapshotCommand({
        failureThreshold: 0.01, // threshold for entire image
        failureThresholdType: 'percent', // percent of image or number of pixels
    });
} else {
    Cypress.Commands.add('matchImageSnapshot', () => cy.log('skipping image snapshot'));
}

Cypress.Commands.add('prefixedVisit', prefixedVisit);
Cypress.Commands.add('resetDb', { prevSubject: false }, resetDb);
Cypress.Commands.add('connectDevice', connectDevice);
Cypress.Commands.add('connectBootloaderDevice', connectBootloaderDevice);
Cypress.Commands.add('changeDevice', changeDevice);
// assertion helpers
Cypress.Commands.add('onboardingShouldLoad', onboardingShouldLoad);
Cypress.Commands.add('dashboardShouldLoad', dashboardShouldLoad);
Cypress.Commands.add('discoveryShouldFinish', discoveryShouldFinish);
// selector helpers
Cypress.Commands.add('getTestElement', getTestElement);
Cypress.Commands.add('getConfirmActionOnDeviceModal', getConfirmActionOnDeviceModal);
Cypress.Commands.add('hoverTestElement', hoverTestElement);

// various shortcuts
Cypress.Commands.add('toggleDeviceMenu', toggleDeviceMenu);
Cypress.Commands.add('toggleDebugModeInSettings', toggleDebugModeInSettings);
Cypress.Commands.add('passThroughInitialRun', passThroughInitialRun);
Cypress.Commands.add('passThroughBackup', passThroughBackup);
Cypress.Commands.add('passThroughBackupShamir', passThroughBackupShamir);
Cypress.Commands.add('passThroughInitMetadata', passThroughInitMetadata);
Cypress.Commands.add('passThroughSetPin', passThroughSetPin);
Cypress.Commands.add('enableRegtestAndGetCoins', enableRegtestAndGetCoins);
// redux
Cypress.Commands.add('dispatch', dispatch);
// skip tests conditionally
Cypress.Commands.add('skipOn', skipOn);
Cypress.Commands.add('onlyOn', onlyOn);

Cypress.Commands.add('text', { prevSubject: true }, subject => subject.text());
Cypress.Commands.add('createAccountFromMyAccounts', createAccountFromMyAccounts);
