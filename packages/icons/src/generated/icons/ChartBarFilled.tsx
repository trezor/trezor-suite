import type { SVGProps } from 'react';
const SvgChartBarFilled = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M29 26a1 1 0 0 1-1 1H4a1 1 0 0 1 0-2h1v-8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v8h2V11a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v14h2V5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v20h1a1 1 0 0 1 1 1"
        />
    </svg>
);
export { SvgChartBarFilled as ReactComponent };
