import type { SVGProps } from 'react';
const SvgArrowsVertical = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M20.707 24.292a1 1 0 0 1 0 1.415l-4 4a1 1 0 0 1-1.415 0l-4-4a1 1 0 0 1 1.415-1.415L15 26.586V5.414l-2.293 2.293a1 1 0 1 1-1.415-1.415l4-4a1 1 0 0 1 1.415 0l4 4a1 1 0 1 1-1.415 1.415L17 5.414v21.172l2.292-2.294a1 1 0 0 1 1.415 0"
        />
    </svg>
);
export { SvgArrowsVertical as ReactComponent };
