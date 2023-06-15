import { urlSearchParams } from '@trezor/suite/src/utils/suite/metadata';
import { EventType, SuiteAnalyticsEvent } from '@trezor/suite-analytics';

// @group:device-management
// @retry=2

type Requests = ReturnType<typeof urlSearchParams>[];
let requests: Requests;

describe('Backup fail', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: true });
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();

        cy.intercept({ hostname: 'data.trezor.io', url: '/suite/log/**' }, req => {
            const params = urlSearchParams(req.url);
            requests.push(params);
        });
        requests = [];
    });

    it('Backup failed - device disconnected during action', () => {
        cy.getTestElement('@notification/no-backup/button').click();
        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/check-item/has-enough-time').click();
        cy.getTestElement('@backup/check-item/is-in-private').click();
        cy.getTestElement('@backup/start-button').click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.task('stopEmu');
        cy.getTestElement('@backup/no-device', { timeout: 30000 });
        cy.task('startEmu');
        cy.getTestElement('@backup/error-message', { timeout: 30000 });

        cy.log(
            'Now go to dashboard and see if security card and notification reflects backup failed state correctly',
        );
        cy.getTestElement('@backup/close-button').click();

        cy.getTestElement('@notification/failed-backup/cta').should('be.visible');

        cy.getTestElement('@dashboard/security-card/backup/button', { timeout: 30000 }).should(
            'be.disabled',
        );

        cy.wrap(requests).then(requestsArr => {
            const createBackupEvent = requestsArr.find(
                req => req.c_type === EventType.CreateBackup,
            ) as Extract<SuiteAnalyticsEvent, { type: EventType.CreateBackup }>['payload'];

            expect(createBackupEvent.status).to.equal('error');
            expect(createBackupEvent.error).to.be.oneOf([
                'device+disconnected+during+action',
                'Device+disconnected',
                'session+not+found',
            ]);
        });
    });
});

export {};
