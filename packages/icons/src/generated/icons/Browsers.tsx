import type { SVGProps } from 'react';
const SvgBrowsers = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M27 5H9a2 2 0 0 0-2 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-2h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-4 6v2H5v-2zm0 14H5V15h18zm4-4h-2V11a2 2 0 0 0-2-2H9V7h18z"
        />
    </svg>
);
export { SvgBrowsers as ReactComponent };
