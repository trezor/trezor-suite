import type { SVGProps } from 'react';
const SvgArrowLeft = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M28 16a1 1 0 0 1-1 1H7.414l7.294 7.293a1 1 0 0 1-.325 1.631 1 1 0 0 1-1.09-.216l-9-9a1 1 0 0 1 0-1.415l9-9a1 1 0 1 1 1.415 1.415L7.414 15H27a1 1 0 0 1 1 1"
        />
    </svg>
);
export { SvgArrowLeft as ReactComponent };
