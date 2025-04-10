import { BuyTrade } from 'invity-api';

import { trezorLogo } from '@suite-common/suite-constants';

import {
    applyHtmlTemplate,
    buildTradingUrl,
    getRequestFormSource,
    getSourceForForm,
} from '../tradeFormUtils';

describe('tradeFormUtils', () => {
    describe('applyHtmlTemplate', () => {
        it('should have content', () => {
            expect(applyHtmlTemplate('CONTENT_TO_EMBED')).toBe(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Trezor Suite</title>
                
                <style>
                    body, html {
                      width: 100%;
                      height: 100%;
                      margin: 0;
                      padding: 0;
                      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                      align-items: center;
                    }
                    a {
                        text-decoration: none;
                        cursor: pointer;
                        color: #171717;
                        font-weight: 500;
                        display: inline-flex;
                        align-items: center;
                    }
                    a:hover {
                      text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <img style="margin-bottom:40px" alt="trezor logo" src="data:image/png;base64, ${trezorLogo}" />
                CONTENT_TO_EMBED
                <a style="margin-top:40px" href="trezorsuitelite://">Go back</a>
            </body>
        </html>
    `);
        });
    });

    it('should have content with options', () => {
        expect(
            applyHtmlTemplate('CONTENT_TO_EMBED', {
                title: 'TITLE',
                script: 'SCRIPT',
                backUrl: 'BACK_URL',
            }),
        ).toStrictEqual(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>TITLE</title>
                SCRIPT
                <style>
                    body, html {
                      width: 100%;
                      height: 100%;
                      margin: 0;
                      padding: 0;
                      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                      align-items: center;
                    }
                    a {
                        text-decoration: none;
                        cursor: pointer;
                        color: #171717;
                        font-weight: 500;
                        display: inline-flex;
                        align-items: center;
                    }
                    a:hover {
                      text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <img style="margin-bottom:40px" alt="trezor logo" src="data:image/png;base64, ${trezorLogo}" />
                CONTENT_TO_EMBED
                <a style="margin-top:40px" href="BACK_URL">Go back</a>
            </body>
        </html>
    `);
    });
});

describe('getRequestFormSource', () => {
    it('should return null when no form is provided', () => {
        expect(getRequestFormSource({})).toBeNull();
    });

    it('should return uri for GET formMethod', () => {
        expect(
            getRequestFormSource({
                form: {
                    formMethod: 'GET',
                    formAction: 'get_action',
                    fields: {},
                },
            }),
        ).toStrictEqual({
            uri: 'get_action',
        });
    });

    it('should return null for IFRAME formMethod', () => {
        expect(
            getRequestFormSource({
                form: {
                    formMethod: 'IFRAME',
                    formAction: 'get_action',
                    fields: {},
                },
            }),
        ).toBeNull();
    });

    it('should create script with form for POST formMethod', () => {
        expect(
            getRequestFormSource({
                form: {
                    formMethod: 'POST',
                    formAction: 'post_action',
                    fields: { key1: 'value1', key2: 'value2' },
                },
            }),
        ).toStrictEqual({
            html: `
        Forwarding to post_action...
        <form id="buy-form" method="POST" action="post_action" target='_self'>
        <input type="hidden" name="key1" value="value1"><input type="hidden" name="key2" value="value2">
        </form>
        <script type="text/javascript">document.getElementById("buy-form").submit();</script>`,
        });
    });

    describe('getSourceForForm', () => {
        it('should return null when no form is provided', () => {
            expect(getSourceForForm(undefined)).toBeNull();
        });

        it('should return uri object for GET form', () => {
            expect(
                getSourceForForm({
                    formMethod: 'GET',
                    formAction: 'get_action',
                    fields: {},
                }),
            ).toStrictEqual({
                uri: 'get_action',
            });
        });

        it('should return html object for POST form', () => {
            const result = getSourceForForm(
                {
                    formMethod: 'POST',
                    formAction: 'post_action',
                    fields: { key: 'value' },
                },
                'custom_back_url',
            );

            expect(result).toHaveProperty('html');
            expect(result?.html).toContain('post_action');
            expect(result?.html).toContain('custom_back_url');
        });
    });
});

describe('buildTradingUrl', () => {
    it('should return correct url format', () => {
        expect(
            buildTradingUrl('quote', {
                receiveCurrency: 'btc',
                fiatCurrency: 'usd',
                fiatAmount: 1234,
            } as BuyTrade),
        ).toBe('trezorsuitelite://buy/quote?receive=btc&send=usd&fiatAmount=1234');
    });
});
