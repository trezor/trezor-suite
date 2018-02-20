/* @flow */
'use strict';

export const getViewportHeight = (): number => (
    window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight
)

export const getScrollY = (): number => {
    if (window.pageYOffset !== undefined) {
        return window.pageYOffset;
    } else if (window.scrollTop !== undefined) {
        return window.scrollTop;
    } else {
        return (document.documentElement || document.body.parentNode || document.body).scrollTop;
    }
}