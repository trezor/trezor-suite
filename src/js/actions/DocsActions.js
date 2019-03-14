/* @flow */

import Markdown from 'markdown-it';
import MarkdownReplaceLink from 'markdown-it-replace-link';
import MarkdownReplaceLinkAttrs from 'markdown-it-link-attributes';

export const DOCS_LOADING: string = 'docs_loading';
export const DOCS_LOADED: string = 'docs_loaded';
export const DOCS_ERROR: string = 'docs_error';

const CDN: string = 'https://gitcdn.link/repo/trezor/connect/develop/docs/';
const GITHUB: string = 'https://github.com/trezor/connect/blob/develop/docs/';

export const loadDocs = () => async (dispatch, getState) => {

    const { method, docs } = getState();
    const documentation = docs.find(d => d.name === method.name);
    if (documentation || !method.docs) return;

    dispatch(onLoading(method));

    const url = `${ CDN }${ method.docs }`;
    const response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
        const content = await response.text();
        const markdown = new Markdown({
            replaceLink: (link, env) => {
                return `${ GITHUB }${ link }`;
            }
        });
        markdown.use(MarkdownReplaceLink);
        markdown.use(MarkdownReplaceLinkAttrs, {
            attrs: {
                target: '_blank',
                rel: 'noopener'
            }
        });
        const html = markdown.render(content);

        dispatch(onLoaded(method, html));
    } else {
        dispatch(onError(method));
    }
}

const onLoading = (method) => {
    return {
        type: DOCS_LOADING,
        docs: {
            name: method.name,
            loading: true,
            html: `Loading from ${ GITHUB }${ method.docs }...`,
        }
    }
}

const onLoaded = (method, html) => {
    return {
        type: DOCS_LOADED,
        docs: {
            name: method.name,
            loading: false,
            html,
        }
    }
}

const onError = (method) => {
    const url = `${ GITHUB }${ method.docs }`;
    return {
        type: DOCS_LOADED,
        docs: {
            name: method.name,
            loading: false,
            html: `Read on <a href="${ url }" target="_blank" rel="noopener">Github</a>`,
        }
    }
}