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
}

const WebusbButton = ({ ready }: Props) => {
    const getOffset = (el: HTMLElement) => {
        const { top, left, right } = el.getBoundingClientRect();
        return {
            top: top + window.pageYOffset,
            left: left + window.pageXOffset,
            right: right + window.pageXOffset,
        };
    };

    useEffect(() => {
        const moveWebusbIn = () => {
            const elem = document.getElementsByClassName('trezor-webusb-button')[0] as HTMLElement;
            const placeholder = document.getElementById('web-usb-placeholder');
            const iframe = document.getElementsByTagName('iframe')[0];
            if (!elem || !placeholder) return;
            const { top, left, right } = getOffset(placeholder);
            elem.style.top = `${top}px`;
            elem.style.left = `${left}px`;
            elem.style.width = `${right - left}px`;
            iframe.style.width = `${right - left}px`;
            elem.style.zIndex = '9999999';
        };

        const moveWebusbOut = () => {
            const elem = document.getElementsByClassName('trezor-webusb-button')[0] as HTMLElement;
            if (!elem) return;
            elem.style.zIndex = '-1000';
            elem.style.top = '-1000px';
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
    }, [ready]);

    return <div id="web-usb-placeholder" style={{ width: '100%', height: '40px' }} />;
};

export default WebusbButton;
