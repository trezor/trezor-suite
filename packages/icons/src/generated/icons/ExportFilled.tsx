import type { SVGProps } from 'react';
const SvgExportFilled = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" {...props}>
        <path
            fill="currentColor"
            d="M17 12h-2V5.414l-3.293 3.294a1 1 0 1 1-1.415-1.415l5-5a1 1 0 0 1 1.415 0l5 5a1.001 1.001 0 0 1-1.415 1.415L17 5.414zm8 0h-8v5a1 1 0 0 1-2 0v-5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V14a2 2 0 0 0-2-2"
        />
    </svg>
);
export { SvgExportFilled as ReactComponent };
