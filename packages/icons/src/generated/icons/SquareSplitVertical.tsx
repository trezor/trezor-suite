import type { SVGProps } from 'react';
const SvgSquareSplitVertical = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M25 5H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m0 2v8H7V7zm0 18H7v-8h18z"
        />
    </svg>
);
export { SvgSquareSplitVertical as ReactComponent };
