import type { SVGProps } from 'react';
const SvgNotches = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="m26.708 16.707-10 10a1 1 0 0 1-1.415-1.415l10-10a1 1 0 0 1 1.415 1.415m-2-12.415a1 1 0 0 0-1.415 0l-19 19a1 1 0 1 0 1.415 1.415l19-19a1 1 0 0 0 0-1.415"
        />
    </svg>
);
export { SvgNotches as ReactComponent };
