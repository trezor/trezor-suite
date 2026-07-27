import type { SVGProps } from 'react';
const SvgControlFilled = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M25.924 15.383A1 1 0 0 1 25 16H7a1.001 1.001 0 0 1-.707-1.707l9-9a1 1 0 0 1 1.415 0l9 9a1 1 0 0 1 .216 1.09"
        />
    </svg>
);
export { SvgControlFilled as ReactComponent };
