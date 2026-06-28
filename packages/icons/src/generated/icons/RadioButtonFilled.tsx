import type { SVGProps } from 'react';
const SvgRadioButtonFilled = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            fillRule="evenodd"
            d="M3 16C3 8.82 8.82 3 16 3s13 5.82 13 13-5.82 13-13 13S3 23.18 3 16"
            clipRule="evenodd"
        />
    </svg>
);
export { SvgRadioButtonFilled as ReactComponent };
