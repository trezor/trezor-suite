import type { SVGProps } from 'react';
const SvgPlayCircle = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m0 24a11 11 0 1 1 11-11 11.01 11.01 0 0 1-11 11m4.555-11.832-6-4A1 1 0 0 0 13 12v8a1 1 0 0 0 1.555.832l6-4a1 1 0 0 0 0-1.665zM15 18.13v-4.256L18.198 16 15 18.131z"
        />
    </svg>
);
export { SvgPlayCircle as ReactComponent };
