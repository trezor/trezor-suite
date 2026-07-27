import type { SVGProps } from 'react';
const SvgFlagPennant = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="m30.329 12.055-23-8A1 1 0 0 0 6 5v22a1 1 0 1 0 2 0v-5.289l22.329-7.766a1.001 1.001 0 0 0 0-1.89M8 19.594V6.406L26.956 13z"
        />
    </svg>
);
export { SvgFlagPennant as ReactComponent };
