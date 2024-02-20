import Markdown from 'markdown-it';
import MarkdownReplaceLink from 'markdown-it-replace-link';
import MarkdownReplaceLinkAttrs from 'markdown-it-link-attributes';

import type { GetState, Dispatch, AppState } from '../types';
import type { Docs } from '../reducers/docsReducer';

export const DOCS_LOADING = 'docs_loading';
export const DOCS_LOADED = 'docs_loaded';
export const DOCS_ERROR = 'docs_error';

const CDN = 'https://raw.githubusercontent.com/trezor/trezor-suite/develop/docs/packages/connect/';
const GITHUB = 'https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect';

export type DocsAction =
    | { type: typeof DOCS_LOADING; docs: Docs }
    | { type: typeof DOCS_LOADED; docs: Docs }
    | { type: typeof DOCS_ERROR; docs: Docs };

const onLoading = (method: AppState['method']) => ({
    type: DOCS_LOADING,
    docs: {
        name: method?.name,
        loading: true,
        html: `Loading from ${GITHUB}${method?.docs}...`,
    },
});

const onLoaded = (method: AppState['method'], html: string) => ({
    type: DOCS_LOADED,
    docs: {
        name: method?.name,
        loading: false,
        html,
    },
});

const onError = (method: AppState['method']) => {
    const url = `${GITHUB}${method?.docs}`;

    return {
        type: DOCS_LOADED,
        docs: {
            name: method?.name,
            loading: false,
            html: `Read on <a href="${url}" target="_blank" rel="noopener">Github</a>`,
        },
    };
};

export const loadDocs = () => async (dispatch: Dispatch, getState: GetState) => {
    const { method, docs } = getState();
    const documentation = docs.find(d => d.name === method?.name);
    if (documentation || !method?.docs) return;

    dispatch(onLoading(method));

    const url = `${CDN}${method.docs}`;
    const response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
        const content = await response.text();
        // @ts-expect-error
        const markdown = new Markdown({
            replaceLink: (link: any, _env: any) => `${GITHUB}${link}`,
        });
        // @ts-expect-error
        markdown.use(MarkdownReplaceLink);
        markdown.use(MarkdownReplaceLinkAttrs, {
            attrs: {
                target: '_blank',
                rel: 'noopener',
            },
        });
        const html = markdown.render(content);

        dispatch(onLoaded(method, html));
    } else {
        dispatch(onError(method));
    }
};
