// todo: either use this
// export const parseUri = (uri: string) => {
//     try {
//         return new URL(uri);
//     } catch (e) {
//         // empty
//     }
// };

// todo: or this

interface Opts {
    strictMode?: boolean;
}

export const parseUri = (str: string, opts: Opts = {}) => {
    if (!str) return undefined;

    const o = {
        key: [
            'source',
            'protocol',
            'authority',
            'userInfo',
            'user',
            'password',
            'host',
            'port',
            'relative',
            'path',
            'directory',
            'file',
            'query',
            'anchor',
        ],
        q: {
            name: 'queryKey',
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g,
        },
        parser: {
            strict: /^(?:([^:/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?))?((((?:[^?#/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose: /^(?:(?![^:@]+:[^:@/]*@)([^:/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#/]*\.[^?#/.]+(?:[?#]|$)))*\/?)?([^?#/]*))(?:\?([^#]*))?(?:#(.*))?)/,
        },
    };

    const m = o.parser[opts.strictMode ? 'strict' : 'loose'].exec(str);
    const uri: Record<string, string> = {};
    let i = 14;

    // @ts-ignore
    while (i--) uri[o.key[i]] = m[i] || '';

    // @ts-ignore
    uri[o.q.name] = {};
    // @ts-ignore
    uri[o.key[12]].replace(o.q.parser, ($0, $1, $2) => {
        // @ts-ignore
        if ($1) uri[o.q.name][$1] = $2;
    });

    return uri;
};
