import type { SVGProps } from 'react';
const SvgRows = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M26 17H6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2m0 7H6v-5h20zm0-18H6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2m0 7H6V8h20z"
        />
    </svg>
);
export { SvgRows as ReactComponent };
