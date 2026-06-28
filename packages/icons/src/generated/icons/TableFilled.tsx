import type { SVGProps } from 'react';
const SvgTableFilled = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M28 6H4a1 1 0 0 0-1 1v17a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V7a1 1 0 0 0-1-1M5 14h5v4H5zm7 0h15v4H12zm-7 6h5v4H5zm22 4H12v-4h15z"
        />
    </svg>
);
export { SvgTableFilled as ReactComponent };
