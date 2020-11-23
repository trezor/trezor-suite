// @group:suite
// @retry=2

const fixtures = [
    {
        route: '/settings',
        buttonRequests: [
            {
                req: {
                    type: 'ui-button',
                    payload: { code: 'ButtonRequest_Other', device: {} },
                },
                el: '@suite/modal/confirm-action-on-device',
            },
            {
                req: {
                    type: 'ui-request_pin',
                    payload: { device: {} },
                },
                el: '@modal/pin',
            },
        ],
    },
    {
        route: '/onboarding',
        buttonRequests: [
            {
                req: {
                    type: 'ui-button',
                    payload: { code: 'ButtonRequest_Other', device: {} },
                },
                el: '@suite/modal/confirm-action-on-device',
            },
            {
                req: {
                    type: 'ui-button',
                    payload: { code: 'ButtonRequest_FirmwareCheck', device: {} },
                },
                el: '@suite/modal/confirm-fingerprint-on-device',
            },
            {
                req: {
                    type: 'ui-request_pin',
                    payload: { device: {} },
                },
                el: '@modal/pin',
            },
        ],
    },
    {
        route: '/firmware',
        buttonRequests: [
            {
                req: {
                    type: 'ui-button',
                    payload: { code: 'ButtonRequest_Other', device: {} },
                },
                el: '@suite/modal/confirm-action-on-device',
            },
            {
                req: {
                    type: 'ui-button',
                    payload: { code: 'ButtonRequest_FirmwareCheck', device: {} },
                },
                el: '@suite/modal/confirm-fingerprint-on-device',
            },
            {
                req: {
                    type: 'ui-request_pin',
                    payload: { device: {} },
                },
                el: '@modal/pin',
            },
        ],
    },
];

describe('Button requests - test how suite reacts to them depending on current active route', () => {
    before(() => {
        cy.task('stopEmu');
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings');
        cy.passThroughInitialRun();
    });

    beforeEach(() => {
        cy.window()
            .its('TrezorConnect')
            .should('exist')
            .then(TrezorConnect => {
                cy.stub(TrezorConnect, 'getDeviceState', () => {
                    return new Promise(resolve => {
                        return resolve({
                            success: true,
                            payload: {
                                state:
                                    '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                            },
                        });
                    });
                });
                cy.stub(TrezorConnect, 'getAccountInfo', () => {
                    return new Promise(resolve => {
                        return resolve({
                            success: false,
                            payload: {},
                        });
                    });
                });
            });
    });

    fixtures.forEach(f => {
        it(f.route, () => {
            cy.prefixedVisit(f.route);
            cy.getTestElement('@suite/loading').should('not.exist');

            f.buttonRequests.forEach(br => {
                // @ts-ignore
                cy.dispatch(br.req);
                cy.getTestElement(br.el);
                cy.dispatch({ type: '@modal/close' });
                cy.getTestElement(br.el).should('not.exist');
            });
        });
    });
});
