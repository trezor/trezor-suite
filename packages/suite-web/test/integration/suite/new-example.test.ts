/* eslint-disable @typescript-eslint/camelcase */
describe('New example with python/bridge/emu', () => {
    beforeEach(() => {
        cy
            .task('startBridge')
            .task('startEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it('new example with python bridge and emulator', () => {
        cy
            .visit('/')
            .onboardingShouldLoad()
            .getTestElement('button-use-wallet').click()
            .walletShouldLoad();
    });
});
