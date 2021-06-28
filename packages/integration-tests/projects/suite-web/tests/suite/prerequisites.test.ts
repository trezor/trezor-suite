import { PrerequisiteType } from "@suite/types/suite";

type Fixture = {
    desc: PrerequisiteType;
    mockDevice: any;
}

describe('prerequisites = test various types of devices connecting to the application', () => {
    beforeEach(() => {

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');

        cy.getTestElement('@connect-device-prompt');
    });

    // todo: add transport related prerequisites
    const fixtures: Fixture[] = [
        {
            desc: 'device-seedless',
            mockDevice: () => cy.connectDevice({ mode: 'seedless' }),
        }, {
            desc: 'device-unacquired',
            mockDevice: () => cy.connectDevice({ type: 'unacquired' }),
        }, {
            desc: 'device-unreadable',
            mockDevice: () => cy.connectDevice({ type: 'unreadable' }),
        }, {
            desc: 'device-unknown',
            mockDevice: () => cy.connectDevice({ features: undefined })
        }, {
            desc: 'device-disconnected',
            mockDevice: () => { },
        },
        {
            desc: 'device-bootloader',
            mockDevice: () => cy.connectBootloaderDevice('1'),
        }
    ];

    fixtures.forEach(f => {
        it(f.desc, () => {
            f.mockDevice();
            cy.getTestElement('@onboarding/expand-troubleshooting-tips').click();
            cy.matchImageSnapshot(f.desc);
        })
    })

    describe('should redirect to onboarding', () => {
        it('to welcome step', () => {
            cy.connectDevice({ mode: 'initialize' });
            cy.getTestElement('@onboarding/welcome');
        });

        // device-recover-mode is tested elsewhere with full-fledged emulator
    })
})