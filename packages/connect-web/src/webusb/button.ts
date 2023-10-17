// origin: https://github.com/trezor/connect/blob/develop/src/js/webusb/button.js

const render = (className = '', url: string) => {
    console.log('className', className);
    console.log('url', url);

    const query = className || '.trezor-webusb-button';
    const buttons = document.querySelectorAll(query);
    console.log(' buttons', buttons);
    const src = `${url}?${Date.now()}`;

    buttons.forEach(b => {
        console.log('b.getElementsByTagName', b.getElementsByTagName('iframe').length);

        if (b.getElementsByTagName('iframe').length < 1) {
            const bounds = b.getBoundingClientRect();
            console.log('bounds', bounds);
            const btnIframe = document.createElement('iframe') as HTMLIFrameElement;
            btnIframe.frameBorder = '0';
            // btnIframe.width = `${Math.round(bounds.width)}px`;
            // btnIframe.height = `${Math.round(bounds.height)}px`;
            btnIframe.width = '200px';
            btnIframe.height = '200px';

            btnIframe.style.position = 'absolute';
            btnIframe.style.top = '0px';
            btnIframe.style.left = '0px';
            btnIframe.style.zIndex = '9999';
            // btnIframe.style.opacity = '0'; // this makes click impossible on cross-origin
            btnIframe.setAttribute('allow', 'usb');
            btnIframe.setAttribute('scrolling', 'no');
            btnIframe.src = src;

            // inject iframe into button
            b.append(btnIframe);
        }
    });
};

export default render;
