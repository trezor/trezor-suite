import type { SVGProps } from 'react';
const SvgTrezorBody = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path fill="currentColor" d="M18.102 22.005a1 1 0 0 1 0 1.99L18 24h-4a1 1 0 1 1 0-2h4z" />
        <path
            fill="currentColor"
            fillRule="evenodd"
            d="M22.117 4a5 5 0 0 1 4.743 3.419l1.986 5.957a3 3 0 0 1 .154.948v5.306a2 2 0 0 1-.481 1.302l-4.563 5.322A5 5 0 0 1 20.16 28h-7.503a5 5 0 0 1-3.536-1.465L3.586 21A2 2 0 0 1 3 19.586v-5.262a3 3 0 0 1 .154-.948L5.14 7.419A5 5 0 0 1 9.883 4zm.507 15.068a5 5 0 0 1-2.906.932h-7.436a5 5 0 0 1-2.906-.932L5 15.942v3.644l5.535 5.535a3 3 0 0 0 2.122.879h7.503c.876 0 1.709-.383 2.279-1.048L27 19.63v-3.688zM9.883 6a3 3 0 0 0-2.846 2.052l-1.855 5.563 5.356 3.826a3 3 0 0 0 1.744.559h7.436c.625 0 1.235-.195 1.744-.559l5.355-3.826-1.854-5.563A3 3 0 0 0 22.117 6z"
            clipRule="evenodd"
        />
    </svg>
);
export { SvgTrezorBody as ReactComponent };
