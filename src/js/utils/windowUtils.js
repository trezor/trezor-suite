/* @flow */
'use strict';

export const getViewportHeight = (): number => (
    // $FlowIssue
    window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight // $FlowIssue
)

export const getScrollY = (): number => {
    if (window.pageYOffset !== undefined) {
        return window.pageYOffset;
    } else if (window.scrollTop !== undefined) {
        return window.scrollTop;
    } else {
        // $FlowIssue
        return (document.documentElement || document.body.parentNode || document.body).scrollTop; // $FlowIssue
    }
}