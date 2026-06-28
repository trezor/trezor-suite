import type { SVGProps } from 'react';
const SvgImageSquareFilled = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M26 4H6a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M6 6h20v9.672l-3.086-3.087a2 2 0 0 0-2.828 0L6.671 26H6zm4 6a2 2 0 1 1 4 0 2 2 0 0 1-4 0"
        />
    </svg>
);
export { SvgImageSquareFilled as ReactComponent };
