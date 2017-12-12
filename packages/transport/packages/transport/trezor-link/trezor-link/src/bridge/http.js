/* @flow */
'use strict';

export type HttpRequestOptions = {
    body?: ?(Array<any> | Object | string);
    url: string;
    method: 'POST' | 'GET';
};

// slight hack to make Flow happy, but to allow Node to set its own fetch
// Request, RequestOptions and Response are built-in types of Flow for fetch API
let _fetch: (input: string | Request, init?: RequestOptions) => Promise<Response> =
  typeof window === `undefined`
    ? () => Promise.reject()
    : window.fetch;

export function setFetch(fetch: any) {
  _fetch = fetch;
}

function contentType(body: any): string {
  if (typeof body === `string`) {
    if (body === ``) {
      return `text/plain`;
    }
    return `application/octet-stream`;
  } else {
    return `application/json`;
  }
}

function wrapBody(body: any): ?string {
  if (typeof body === `string`) {
    return body;
  } else {
    return JSON.stringify(body);
  }
}

function parseResult(text: string): mixed {
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

export async function request(options: HttpRequestOptions): Promise<mixed> {
  const res = await _fetch(options.url, {
    method: options.method,
    headers: {
      'Content-Type': contentType(options.body == null ? `` : options.body),
    },
    body: wrapBody(options.body),
  });
  const resText = await res.text();
  if (res.ok) {
    return parseResult(resText);
  } else {
    const resJson: mixed = parseResult(resText);
    if (typeof resJson === `object` && resJson != null && resJson.error != null) {
      throw new Error(resJson.error);
    } else {
      throw new Error(resText);
    }
  }
}
