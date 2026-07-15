import type { SVGProps } from 'react';
const SvgParallelogram = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M30.679 5.914A2 2 0 0 0 29 5H11.101a2 2 0 0 0-1.823 1.179l-8.1 18A2 2 0 0 0 3 27h17.9a2 2 0 0 0 1.824-1.179l8.1-18a2 2 0 0 0-.144-1.907zM20.899 25H3l8.101-18h17.9z"
        />
    </svg>
);
export { SvgParallelogram as ReactComponent };
