const createFlexBox = (element: HTMLDivElement) => {
    const flexBoxVariants = {
        flex: {
            'flex-direction': 'column',
            'align-items': 'center',
        },
        '-webkit-flex': {
            '-webkit-flex-direction': 'column',
            '-webkit-align-items': 'center',
        },
        // '-webkit-box': {
        //     '-webkit-box-orient': 'vertical',
        //     '-webkit-box-direction': 'normal',
        //     '-webkit-box-align': 'center',
        // },
        '-ms-flexbox': {
            '-ms-flex-direction': 'column',
            '-ms-flex-align': 'center',
        },
    };
    const flexBoxKeys = Object.keys(flexBoxVariants) as (keyof typeof flexBoxVariants)[];

    // try each possible value, getComputedStyle will not return valid value if it's not supported by the browser
    for (let i = 0; i < flexBoxKeys.length; i++) {
        const flexBoxKey = flexBoxKeys[i];
        element.style.display = flexBoxKey;
        if (window.getComputedStyle(element, null).display === flexBoxKey) {
            const alignment = flexBoxVariants[flexBoxKey];
            (Object.keys(alignment) as (keyof typeof alignment)[]).forEach(alignKey => {
                element.style[alignKey] = alignment[alignKey];
            });
            break;
        }
    }
};

const getMaxZIndex = () =>
    Math.max(
        ...Array.from(document.querySelectorAll('body *'), el =>
            parseFloat(window.getComputedStyle(el).zIndex),
        ).filter(zIndex => !Number.isNaN(zIndex)),
        0,
    ).toString();

export const showOverlay = (css?: Record<string, string>) => {
    if (!document.body) return { overlay: null, container: null };

    const overlay = document.createElement('div');

    overlay.style.position = 'fixed';
    overlay.style.overflow = 'auto';
    overlay.style.zIndex = getMaxZIndex();
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.padding = '20px';
    overlay.style.margin = '0px';
    overlay.style.background = 'rgba(0, 0, 0, .35)';

    document.body.appendChild(overlay);

    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.style.display = 'block';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.margin = 'auto';

    if (css) {
        // TODO: any
        (Object.keys(css) as any[]).forEach(key => {
            // Object.keys(css).forEach(key => {
            container.style[key] = css[key];
        });
    }

    overlay.appendChild(container);

    createFlexBox(overlay);

    return { overlay, container };
};

export const hideOverlay = (overlay: HTMLElement) => {
    document.body?.removeChild(overlay);
};

export const showPopupOverlay = (src: string) => {
    const { overlay, container } = showOverlay({
        maxWidth: '80vh',
        maxHeight: '70vh',
    });

    const view = document.createElement('iframe');
    view.frameBorder = '0px';
    view.style.width = '100%';
    view.style.height = '100%';
    view.style.border = '0px';
    view.setAttribute('allow', 'usb');
    view.setAttribute('src', src);

    container?.appendChild(view);

    return overlay;
};
