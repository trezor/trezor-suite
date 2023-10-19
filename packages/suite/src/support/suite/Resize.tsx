import { useEffect, useState } from 'react';
import useDebounce from 'react-use/lib/useDebounce';
import { useDispatch } from 'src/hooks/suite';
import { updateWindowSize } from 'src/actions/suite/resizeActions';

/**
 * Window resize handler
 * Handle changes of window size and dispatch Action with current state to the reducer
 * @returns null
 */

const Resize = () => {
    // useDebounce is triggered on every change of size value
    const [size, setSize] = useState({ width: 0, height: 0 });

    const dispatch = useDispatch();

    useDebounce(() => dispatch(updateWindowSize(size.width, size.height)), 300, [size]);

    useEffect(() => {
        const handleResize = () => {
            setSize({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return null;
};

export default Resize;
