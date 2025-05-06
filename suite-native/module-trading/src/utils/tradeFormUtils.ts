import { FormResponse } from 'invity-api';

import { trezorLogo } from '@suite-common/suite-constants';
import { TradingType } from '@suite-common/trading';
import { xssFilters } from '@trezor/utils';

type TemplateOptions = {
    title?: string;
    script?: string;
    backUrl?: string;
};

type RequestFormSourceReturnType = {
    uri?: string;
    html?: string;
};

export type BuildTradingUrlProps = {
    actionType: 'quote' | 'trade';
    tradeType: TradingType;
    orderId: string | undefined;
};

export const TRADING_URL_BASE = 'trezorsuitelite://trading';
export const TRADING_URL_DEFAULT_BACK = `${TRADING_URL_BASE}/back`;

export const applyHtmlTemplate = (
    content = 'You may now close this window.',
    options?: TemplateOptions,
) => {
    const template = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>${options?.title ?? 'Trezor Suite'}</title>
                ${options?.script || ''}
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
                ${content}
                <a style="margin-top:40px" href="${options?.backUrl ?? TRADING_URL_DEFAULT_BACK}">Go back</a>
            </body>
        </html>
    `;

    return template;
};

export const getRequestFormSource = ({
    form,
}: {
    form?: FormResponse['form'];
}): RequestFormSourceReturnType | null => {
    if (!form) {
        return null;
    }

    const { formMethod, formAction, fields } = form;

    if (formMethod === 'GET') {
        return { uri: formAction };
    }

    if (formMethod === 'IFRAME') {
        return null;
    }

    return {
        html: `
        Forwarding to ${xssFilters.inHTML(formAction)}...
        <form id="buy-form" method="POST" action="${xssFilters.inDoubleQuotes(formAction)}" target='_self'>
        ${Object.entries(fields)
            .map(
                ([key, value]) =>
                    `<input type="hidden" name="${key}" value="${xssFilters.inDoubleQuotes(
                        value,
                    )}">`,
            )
            .join('')}
        </form>
        <script type="text/javascript">document.getElementById("buy-form").submit();</script>`,
    };
};

export const getSourceForForm = (form: FormResponse['form'] | undefined, backUrl?: string) => {
    const source = getRequestFormSource({ form });

    if (source?.uri) {
        return { uri: source.uri };
    } else if (source?.html) {
        return { html: applyHtmlTemplate(source.html, { backUrl }).replace(/\\"/g, '"') };
    }

    return null;
};

export const buildTradingUrl = ({ actionType, tradeType, orderId }: BuildTradingUrlProps) => {
    const url = new URL(TRADING_URL_BASE);
    const { searchParams } = url;
    searchParams.set('action', actionType);
    searchParams.set('tradeType', tradeType);
    if (orderId) {
        searchParams.set('orderId', orderId);
    }

    return url.toString();
};

export const getTradeTypeActionAndOrderIdFromUrl = (url: string) => {
    const urlObj = new URL(url);
    const tradeType = urlObj.searchParams.get('tradeType');
    const action = urlObj.searchParams.get('action');
    const orderId = urlObj.searchParams.get('orderId');

    return { tradeType, action, orderId };
};
