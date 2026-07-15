import type { SVGProps } from 'react';
const SvgDiamond = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M29.416 14.59 17.41 2.583a2 2 0 0 0-2.82 0l-12 12.007a2 2 0 0 0 0 2.82l12.006 12.008a2 2 0 0 0 2.82 0L29.422 17.41a2 2 0 0 0 0-2.82zM16 28 4 16 16 4l12 12z"
        />
    </svg>
);
export { SvgDiamond as ReactComponent };
