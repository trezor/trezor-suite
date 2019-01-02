/* @flow */


export const getViewportHeight = (): number => (
    // $FlowIssue: "clientHeight" missing in null
    document.documentElement.clientHeight || document.body.clientHeight
);

export const getScrollX = (): number => {
    if (window.pageXOffset !== undefined) {
        return window.pageXOffset;
    } if (window.scrollLeft !== undefined) {
        return window.scrollLeft;
    }
    // $FlowIssue: parentNode || scrollLeft missing
    return (document.documentElement || document.body.parentNode || document.body).scrollLeft;
};

export const getScrollY = (): number => {
    if (window.pageYOffset !== undefined) {
        return window.pageYOffset;
    } if (window.scrollTop !== undefined) {
        return window.scrollTop;
    }
    // $FlowIssue: parentNode || scrollTop missing
    return (document.documentElement || document.body.parentNode || document.body).scrollTop;
};