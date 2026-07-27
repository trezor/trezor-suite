import type { SVGProps } from 'react';
const SvgArrowRightFilled = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="m27.707 16.708-9 9A1 1 0 0 1 17 25v-8H5a1 1 0 0 1 0-2h12V7a1 1 0 0 1 1.707-.707l9 9a1 1 0 0 1 0 1.415"
        />
    </svg>
);
export { SvgArrowRightFilled as ReactComponent };
