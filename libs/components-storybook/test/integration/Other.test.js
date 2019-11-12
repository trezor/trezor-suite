describe('Other', () => {
    beforeEach(() => {
        cy.viewport(1008, 768);
        cy.loadContent('/iframe.html?selectedKind=Other&selectedStory=All&full=0');
        // hack to wait for page to load (last coin logo)
        cy.getTestElement('coin_xtz').should('be.visible');
    });

    const tests = [
        'trezor_image_1',
        'trezor_image_2',
        'prompt_1',
        'prompt_2',
        'trezor_logo_horizontal',
        'trezor_logo_vertical',
        'header',
        'loader_default',
        'loader_small_text',
        'loader_transparent_route',
        'loader_white_text',
        'loader_white_text_transparent',
        // icons
        'icon_arrow_down',
        'icon_arrow_left',
        'icon_arrow_right',
        'icon_arrow_up',
        'icon_back',
        'icon_chat',
        'icon_close',
        'icon_cog',
        'icon_download',
        'icon_eject',
        'icon_error',
        'icon_eye_crossed',
        'icon_eye',
        'icon_help',
        'icon_info',
        'icon_menu',
        'icon_plus',
        'icon_qrcode',
        'icon_refresh',
        'icon_skip',
        'icon_success',
        'icon_t1',
        'icon_t2',
        'icon_top',
        'icon_wallet_hidden',
        'icon_wallet_standard',
        'icon_warning',
        // coins
        'coin_ada',
        'coin_bch',
        'coin_btc',
        'coin_btg',
        'coin_dash',
        'coin_dgb',
        'coin_doge',
        'coin_etc',
        'coin_eth',
        'coin_ltc',
        'coin_nem',
        'coin_nmc',
        'coin_rinkeby',
        'coin_trop',
        'coin_txrp',
        'coin_vtc',
        'coin_xem',
        'coin_xlm',
        'coin_xrp',
        'coin_zec',
        'coin_xtz',
    ];

    tests.forEach(testName => {
        it(`${testName}`, () => {
            if (testName.match(/icon|coin|logo|prompt|header/)) {
                cy.getTestElement(testName)
                    .find('svg')
                    .should('exist')
                    .should('be.visible')
            }

            cy.getTestElement(testName)
                .matchImageSnapshot();
        });
    });
});