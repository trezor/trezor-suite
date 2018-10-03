/* @flow */


export const getViewportHeight = (): number => (
    // $FlowIssue
    document.documentElement.clientHeight || document.body.clientHeight // $FlowIssue
);

export const getScrollX = (): number => {
    if (window.pageXOffset !== undefined) {
        return window.pageXOffset;
    } if (window.scrollLeft !== undefined) {
        return window.scrollLeft;
    }
    // $FlowIssue
    return (document.documentElement || document.body.parentNode || document.body).scrollLeft; // $FlowIssue
};

export const getScrollY = (): number => {
    if (window.pageYOffset !== undefined) {
        return window.pageYOffset;
    } if (window.scrollTop !== undefined) {
        return window.scrollTop;
    }
    // $FlowIssue
    return (document.documentElement || document.body.parentNode || document.body).scrollTop; // $FlowIssue
};