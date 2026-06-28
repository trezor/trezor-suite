import type { SVGProps } from 'react';
const SvgParagraph = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M26 5H12a8 8 0 1 0 0 16h5v5a1 1 0 0 0 2 0V7h3v19a1 1 0 0 0 2 0V7h2a1 1 0 1 0 0-2m-9 14h-5a6 6 0 1 1 0-12h5z"
        />
    </svg>
);
export { SvgParagraph as ReactComponent };
