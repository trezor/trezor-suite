import { useEffect } from 'react';

const TrezorConnect = () => {
    useEffect(() => {
        console.warn('init connect!'); /* eslint-disable-line no-console */
        window.addEventListener('message', m => {
            console.warn('IFRAME ONMESSAGE:', m); /* eslint-disable-line no-console */
        });

        const existedFrame: HTMLIFrameElement = document.getElementById(
            'trezorconnect',
        ) as HTMLIFrameElement;
        if (!existedFrame) {
            const iframe = document.createElement('iframe');
            iframe.setAttribute('id', 'trezorconnect');
            iframe.setAttribute('src', 'https://connect.trezor.io/6/iframe.html');
            document.body.appendChild(iframe);
        }

        // setInterval(() => {
        //     tick++;
        //     const time = Date.now() - started;
        //     console.log("HOME TICK...", tick, time)
        // }, 1000);
    }, []);
    return null;
};

export default TrezorConnect;
