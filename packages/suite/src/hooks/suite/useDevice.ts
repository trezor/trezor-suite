import { useSelector } from 'react-redux';
import { AppState } from '@suite-types';

export const useDevice = () => {
    const device = useSelector<AppState, AppState['suite']['device']>(state => state.suite.device);
    return {
        device,
    };
};
