import React, { useEffect } from 'react';

/*
    This component does a little hack.
    In case internet connection turns off and react tries to rerender webusb button 
    the "standard" way, instead of nice button "page was not found" chrome message 
    will appear (dinosaur). 
    To go around this, we need to keep a single instance of iframe somewhere, and only
    turn on and off its visibility. 
*/

interface Props {
    ready: boolean; // are all animations finished?
    children?: React.ReactNode;
}

const WebusbButton = ({ ready, children }: Props) => {
    const childRef = React.createRef<HTMLButtonElement>();

    const getOffset = (el: HTMLElement) => {
        const { top, left, width, height } = el.getBoundingClientRect();
        return {
            top: top + window.pageYOffset,
            left: left + window.pageXOffset,
            height,
            width,
        };
    };

    useEffect(() => {
        const moveWebusbIn = () => {
            // iframe is injected to div.trezor-webusb-button rendered in _app.tsx
            const iframe = document.getElementsByTagName('iframe')[0];
            if (!iframe || !childRef.current) return;
            const { top, left, width, height } = getOffset(childRef.current);
            iframe.style.top = `${top + 1000}px`;
            iframe.style.left = `${left}px`;
            iframe.style.width = `${width}px`;
            iframe.style.height = `${height}px`;
            iframe.style.zIndex = '9999999';
        };

        const moveWebusbOut = () => {
            const iframe = document.getElementsByTagName('iframe')[0];
            if (!iframe) return;
            iframe.style.zIndex = '-1000';
            iframe.style.top = '-1000px';
        };

        const onResize = () => {
            moveWebusbOut();
            moveWebusbIn();
        };

        if (ready) {
            // this setTimeout makes it work. I am not really sure why, or whether it is a good solution (probably not)
            // but only this way button will move to the correct position.
            setTimeout(() => moveWebusbIn(), 0);
            window.addEventListener('resize', onResize);
            return () => {
                moveWebusbOut();
                window.removeEventListener('resize', onResize);
            };
        }
    }, [childRef, ready]);

    if (React.isValidElement(children)) {
        return React.cloneElement(children, { ref: childRef });
    }
    return null;
};

export default WebusbButton;
