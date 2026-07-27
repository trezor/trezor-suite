import type { SVGProps } from 'react';
const SvgWaveform = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M7 12v8a1 1 0 1 1-2 0v-8a1 1 0 1 1 2 0m4-9a1 1 0 0 0-1 1v24a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1m5 4a1 1 0 0 0-1 1v16a1 1 0 0 0 2 0V8a1 1 0 0 0-1-1m5 4a1 1 0 0 0-1 1v8a1 1 0 0 0 2 0v-8a1 1 0 0 0-1-1m5-2a1 1 0 0 0-1 1v12a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1"
        />
    </svg>
);
export { SvgWaveform as ReactComponent };
