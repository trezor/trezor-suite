/* @flow */


export const getViewportHeight = (): number => (
    // $FlowIssue
    window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight // $FlowIssue
);

export const getScrollY = (): number => {
    if (window.pageYOffset !== undefined) {
        return window.pageYOffset;
    } if (window.scrollTop !== undefined) {
        return window.scrollTop;
    }
    // $FlowIssue
    return (document.documentElement || document.body.parentNode || document.body).scrollTop; // $FlowIssue
};