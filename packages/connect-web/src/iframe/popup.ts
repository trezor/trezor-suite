// <iframe id="connectpopup" src="http://localhost:8088/popup.html"
// style="position: absolute; display: block; border: 0px; width: 80vw; height: 80vh; left: 0px; top: 0px; background-color: yellow; margin-left: 10vw;"> </iframe>

export let instance: HTMLIFrameElement | null;

export const init = async (_settings: any) => {
    console.log('iframe popup init');
    instance = document.createElement('iframe');
    instance.frameBorder = '0';
    instance.width = '0px';
    instance.height = '0px';
    instance.style.position = 'absolute';
    instance.style.display = 'none';
    instance.style.border = '0px';
    instance.style.width = '100px';
    instance.style.height = '100px';
    instance.style.color = 'green';
    instance.id = 'connectpopup';

    let src = 'http://localhost:8088/popup.html';

    instance.setAttribute('src', src);

    instance.addEventListener('load', () => {
        console.log('iframe popup loaded');
    });

    instance.addEventListener('message', event => {
        console.log('iframe popup instance message', event);
    });


    if (document.body) {
        document.body.appendChild(instance);
    }

};

