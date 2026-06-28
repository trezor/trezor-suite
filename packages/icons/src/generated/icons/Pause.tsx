import type { SVGProps } from 'react';
const SvgPause = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M25 4h-5a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 22h-5V6h5zM12 4H7a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 22H7V6h5z"
        />
    </svg>
);
export { SvgPause as ReactComponent };
