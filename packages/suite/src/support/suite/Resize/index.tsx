import { Props } from './Container';
import { useEffect } from 'react';
import debounce from 'debounce';

const Resize = (props: Props) => {
    useEffect(() => {
        const handleResize = () => {
            props.updateWindowSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', debounce(handleResize, 250));
        return () => {
            window.removeEventListener('resize', debounce(handleResize, 250));
        };
    });

    return null;
};

export default Resize;
