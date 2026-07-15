import type { SVGProps } from 'react';
const SvgPlaceholder = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M26 4H6a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M6 26V7.414L24.586 26zM7.414 6H26v18.587z"
        />
    </svg>
);
export { SvgPlaceholder as ReactComponent };
