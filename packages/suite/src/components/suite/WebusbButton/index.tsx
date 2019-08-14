import React, { useEffect } from 'react';
import { Button } from '@trezor/components';

/*
    This component does a little hack.
    In case internet connection turns off and react tries to rerender webusb button 
    the "standard" way, instead of nice button "page was not found" chrome message 
    will appear (dinosaur). 
    To go around this, we need to keep a single instance of iframe somewhere, and only
    turn on and off its visibility. 
*/

const WebusbButton = () => {
    const moveWebusbIn = () => {
        const elem = document.getElementById('web-usb-hideout');
        // elem.style.display = 'block';
        const placeholder = document.getElementById('web-usb-placeholder');
        if (!elem || !placeholder) {
            return;
        }
        placeholder.appendChild(elem.children[0]);
    };

    const moveWebusbOut = () => {
        const elem = document.getElementById('web-usb-placeholder');
        const hideout = document.getElementById('web-usb-hideout');
        if (!elem || !hideout) {
            return;
        }
        hideout.appendChild(elem.children[0]);
    };

    useEffect(() => {
        moveWebusbIn();
        return () => {
            moveWebusbOut();
        };
    }, []);

    return <div id="web-usb-placeholder" style={{ width: '100%' }}></div>;
};

export default WebusbButton;
