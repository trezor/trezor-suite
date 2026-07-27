import type { SVGProps } from 'react';
const SvgArrowLineRight = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M23.707 15.293a1 1 0 0 1 0 1.415l-9 9a1 1 0 0 1-1.415-1.415L20.587 17H4a1 1 0 0 1 0-2h16.586l-7.293-7.293a1 1 0 0 1 1.415-1.414zM27 4a1 1 0 0 0-1 1v22a1 1 0 0 0 2 0V5a1 1 0 0 0-1-1"
        />
    </svg>
);
export { SvgArrowLineRight as ReactComponent };
