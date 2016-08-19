/* @flow */
'use strict';

export type RequestOptions = {
    body?: ?(Array<any> | Object | string);
    url: string;
    method: 'POST' | 'GET';
};

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

export default async function request(options: RequestOptions): Promise<mixed> {
  const res = await fetch(options.url, {
    method: options.method,
    headers: {
      'Content-Type': contentType(options.body || ``),
    },
    body: wrapBody(options.body),
  });
  const resText = await res.text();
  if (res.ok) {
    return parseResult(resText);
  } else {
    const resJson = parseResult(resText);
    if (resJson.error) {
      throw new Error(resJson.error);
    } else {
      throw new Error(resText);
    }
  }
}
