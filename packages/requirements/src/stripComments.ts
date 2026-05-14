export const stripComments = (content: string) => {
    let sanitized = '';
    let cursor = 0;

    while (cursor < content.length) {
        const commentStartIndex = content.indexOf('<!--', cursor);

        if (commentStartIndex === -1) {
            sanitized += content.slice(cursor);

            break;
        }

        sanitized += content.slice(cursor, commentStartIndex);

        const commentEndIndex = content.indexOf('-->', commentStartIndex + 4);

        if (commentEndIndex === -1) {
            break;
        }

        cursor = commentEndIndex + 3;
    }

    return sanitized;
};
