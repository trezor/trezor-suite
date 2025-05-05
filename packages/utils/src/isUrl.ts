const URL_REGEXP = /^(http|ws)s?:\/\/[a-z0-9]([a-z0-9.-]+)?(:[0-9]{1,5})?(\/[a-z0-9-_]+)*\/?$/i;

const URL_WITH_QUERY_REGEXP =
    /^(http|ws)s?:\/\/[a-z0-9]([a-z0-9.-]+)?(:[0-9]{1,5})?(\/[a-z0-9-_]+)*\/?(\?[a-z0-9-_]+=[a-z0-9-_]+(&[a-z0-9-_]+=[a-z0-9-_]+)*)?$/i;

export const isUrl = (value: string): boolean => URL_REGEXP.test(value);

export const isUrlWithQuery = (value: string): boolean => URL_WITH_QUERY_REGEXP.test(value);
