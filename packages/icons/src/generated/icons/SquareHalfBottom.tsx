import type { SVGProps } from 'react';
const SvgSquareHalfBottom = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M25 5H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m0 2v8H7V7zM13 17v8h-2v-8zm2 0h2v8h-2zm4 0h2v8h-2zM7 17h2v8H7zm18 8h-2v-8h2z"
        />
    </svg>
);
export { SvgSquareHalfBottom as ReactComponent };
