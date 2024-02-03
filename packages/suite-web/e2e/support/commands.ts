/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-var-requires */

import {
    onboardingShouldLoad,
    dashboardShouldLoad,
    discoveryShouldFinish,
} from './utils/assertions';
import { getTestElement, getConfirmActionOnDeviceModal, hoverTestElement } from './utils/selectors';
import { resetDb } from './utils/test-env';
import {
    toggleDeviceMenu,
    enableDebugMode,
    toggleDebugModeInSettings,
    passThroughInitialRun,
    passThroughAuthenticityCheck,
    passThroughBackup,
    passThroughBackupShamir,
    passThroughInitMetadata,
    passThroughSetPin,
    enableRegtestAndGetCoins,
    createAccountFromMyAccounts,
    interceptDataTrezorIo,
    findAnalyticsEventByType,
    enterPinOnBlindMatrix,
} from './utils/shortcuts';
import { interceptInvityApi } from './utils/intercept-invity-api';
import { SuiteAnalyticsEvent } from '@trezor/suite-analytics';
import { EventPayload, Requests } from './types';

const command = require('cypress-image-snapshot/command');

const prefixedVisit = (route: string, options?: Partial<Cypress.VisitOptions>) => {
    const baseUrl = Cypress.config('baseUrl');
    const assetPrefix = Cypress.env('ASSET_PREFIX') || '';
    const testUrl = Cypress.env('TEST_URLS')?.[0] || '';
    cy.visit(baseUrl + testUrl + assetPrefix + route, options);
    return cy.document().its('fonts.status').should('equal', 'loaded');
};

const safeReload = () => {
    // waiting for:
    // - device is released
    // - writes to indexedDB are finished
    cy.wait(2000);
    return cy.reload();
};

beforeEach(() => {
    console.log('Cypress.env', Cypress.env('USE_TREZOR_USER_ENV'));
    const suiteName = (Cypress as any).mocha.getRunner().suite.ctx.currentTest.parent.title;
    const testName = (Cypress as any).mocha.getRunner().suite.ctx.currentTest.title;

    cy.task('trezorUserEnvConnect');
    cy.task('logTestDetails', `New test case: ${suiteName} - ${testName}`);
    cy.log('stop bridge before every test to make sure that there is no pending session');
    cy.task('stopBridge');
    cy.task('stopEmu');
    cy.task('stopMockedBridge');

    if (Cypress.env('USE_TREZOR_USER_ENV_BRIDGE')) {
        cy.intercept('*', { hostname: '127.0.0.1' }, req => {
            req.url = req.url.replace('21325', '21326');
        });
    }

    cy.task('resetCRI');

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

    // cy.visit('/');
});

afterEach(() => {
    cy.task('trezorUserEnvDisconnect');
    cy.task('stopMockedBridge');
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
            matchImageSnapshot: (typeof cy)['screenshot'];
            onboardingShouldLoad: () => Chainable<Subject>;
            dashboardShouldLoad: () => Chainable<Subject>;
            discoveryShouldFinish: () => Chainable<Subject>;
            toggleDeviceMenu: () => Chainable<Subject>;
            enableDebugMode: () => Chainable<Subject>;
            toggleDebugModeInSettings: () => Chainable<Subject>;
            text: () => Chainable<Subject>;
            passThroughInitialRun: () => Chainable<Subject>;
            passThroughAuthenticityCheck: () => Chainable<Subject>;
            passThroughBackup: () => Chainable<Subject>;
            passThroughBackupShamir: (shares: number, threshold: number) => Chainable<Subject>;
            passThroughSetPin: () => Chainable<Subject>;
            passThroughInitMetadata: (provider: 'dropbox' | 'google') => Chainable<Subject>;
            enableRegtestAndGetCoins: (params: {
                payments: { address: string; amount: number }[];
            }) => Chainable<Subject>;
            skipOn: (nameOrFlag: string | boolean, cb?: () => void) => Cypress.Chainable<any>;
            onlyOn: (nameOrFlag: string | boolean, cb?: () => void) => Cypress.Chainable<any>;
            createAccountFromMyAccounts: (coin: string, label: string) => Chainable<Subject>;
            interceptInvityApi: () => void;
            interceptDataTrezorIo: (requests: Requests) => Cypress.Chainable<null>;
            findAnalyticsEventByType: <T extends SuiteAnalyticsEvent>(
                requests: Requests,
                eventType: T['type'],
            ) => Cypress.Chainable<NonNullable<EventPayload<T>>>;
            enterPinOnBlindMatrix: (entryPinNumber: string) => Cypress.Chainable<null>;
            safeReload: typeof safeReload;
        }
    }
}

if (Cypress.env('SNAPSHOT')) {
    command.addMatchImageSnapshotCommand({
        failureThreshold: 0.01, // threshold for entire image
        failureThresholdType: 'percent', // percent of image or number of pixels
    });
} else {
    Cypress.Commands.add('matchImageSnapshot', () => {
        cy.log('skipping image snapshot');
    });
}

Cypress.Commands.add('prefixedVisit', prefixedVisit);
Cypress.Commands.add('safeReload', safeReload);
Cypress.Commands.add('resetDb', { prevSubject: false }, resetDb);
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
Cypress.Commands.add('enableDebugMode', enableDebugMode);
Cypress.Commands.add('toggleDebugModeInSettings', toggleDebugModeInSettings);
Cypress.Commands.add('passThroughInitialRun', passThroughInitialRun);
Cypress.Commands.add('passThroughAuthenticityCheck', passThroughAuthenticityCheck);
Cypress.Commands.add('passThroughBackup', passThroughBackup);
Cypress.Commands.add('passThroughBackupShamir', passThroughBackupShamir);
Cypress.Commands.add('passThroughInitMetadata', passThroughInitMetadata);
Cypress.Commands.add('passThroughSetPin', passThroughSetPin);
// @ts-expect-error
Cypress.Commands.add('enableRegtestAndGetCoins', enableRegtestAndGetCoins);

Cypress.Commands.add('text', { prevSubject: true }, subject => subject.text());
Cypress.Commands.add('createAccountFromMyAccounts', createAccountFromMyAccounts);
Cypress.Commands.add('interceptInvityApi', interceptInvityApi);
Cypress.Commands.add('interceptDataTrezorIo', interceptDataTrezorIo);

Cypress.Commands.add('findAnalyticsEventByType', findAnalyticsEventByType);
Cypress.Commands.add('enterPinOnBlindMatrix', enterPinOnBlindMatrix);
