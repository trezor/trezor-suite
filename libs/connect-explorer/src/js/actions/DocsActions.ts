import Markdown from 'markdown-it';
import MarkdownReplaceLink from 'markdown-it-replace-link';
import MarkdownReplaceLinkAttrs from 'markdown-it-link-attributes';

import { Dispatch, GetState } from '../types';

export const DOCS_LOADING = 'docs_loading';
export const DOCS_LOADED = 'docs_loaded';
export const DOCS_ERROR = 'docs_error';

const CDN = 'https://gitcdn.link/repo/trezor/connect/develop/docs/';
const GITHUB = 'https://github.com/trezor/connect/blob/develop/docs/';

interface Body {
    name: string;
    loading: boolean;
    html: string;
}

export type DocsActions =
    | { type: typeof DOCS_LOADING; docs: Body }
    | { type: typeof DOCS_LOADED; docs: Body }
    | { type: typeof DOCS_ERROR; docs: Body };

const onLoading = method => {
    return {
        type: DOCS_LOADING,
        docs: {
            name: method.name,
            loading: true,
            html: `Loading from ${GITHUB}${method.docs}...`,
        },
    };
};

const onLoaded = (method, html) => {
    return {
        type: DOCS_LOADED,
        docs: {
            name: method.name,
            loading: false,
            html,
        },
    };
};

const onError = method => {
    const url = `${GITHUB}${method.docs}`;
    return {
        type: DOCS_LOADED,
        docs: {
            name: method.name,
            loading: false,
            html: `Read on <a href="${url}" target="_blank" rel="noopener">Github</a>`,
        },
    };
};

export const loadDocs = () => async (dispatch: Dispatch, getState: GetState) => {
    const { method, docs } = getState();
    const documentation = docs.find(d => d.name === method.name);
    if (documentation || !method.docs) return;
    // @ts-ignore
    dispatch(onLoading(method));

    const url = `${CDN}${method.docs}`;
    const response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
        const content = await response.text();
        const markdown = new Markdown({
            replaceLink: link => {
                return `${GITHUB}${link}`;
            },
        });
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
