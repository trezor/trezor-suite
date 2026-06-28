import type { SVGProps } from 'react';
const SvgEquals = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M28 20a1 1 0 0 1-1 1H5a1 1 0 0 1 0-2h22a1 1 0 0 1 1 1M5 13h22a1 1 0 0 0 0-2H5a1 1 0 0 0 0 2"
        />
    </svg>
);
export { SvgEquals as ReactComponent };
