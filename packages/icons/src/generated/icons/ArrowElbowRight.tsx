import type { SVGProps } from 'react';
const SvgArrowElbowRight = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M30 10v9a1 1 0 1 1-2 0v-6.586L15.707 24.707a1 1 0 0 1-1.415 0l-12-12a1 1 0 1 1 1.416-1.415L15 22.587 26.586 11H20a1 1 0 0 1 0-2h9a1 1 0 0 1 1 1"
        />
    </svg>
);
export { SvgArrowElbowRight as ReactComponent };
