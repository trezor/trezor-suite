import type { SVGProps } from 'react';
const SvgCards = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M23 9H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2m0 16H5V11h18zm6-18v15a1 1 0 0 1-2 0V7H8a1 1 0 0 1 0-2h19a2 2 0 0 1 2 2"
        />
    </svg>
);
export { SvgCards as ReactComponent };
