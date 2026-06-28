import type { SVGProps } from 'react';
const SvgBedFilled = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M26 9H3V6a1 1 0 0 0-2 0v20a1 1 0 1 0 2 0v-4h26v4a1 1 0 0 0 2 0V14a5 5 0 0 0-5-5M3 11h9v9H3z"
        />
    </svg>
);
export { SvgBedFilled as ReactComponent };
