import type { SVGProps } from 'react';
const SvgArrowUpRight = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M25 8v13a1 1 0 1 1-2 0V10.414L8.707 24.707a1 1 0 0 1-1.415-1.415L21.586 9H11a1 1 0 0 1 0-2h13a1 1 0 0 1 1 1"
        />
    </svg>
);
export { SvgArrowUpRight as ReactComponent };
