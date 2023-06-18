import { useSelector } from './useSelector';
import { TrezorDevice } from 'src/types/suite/index';
import { selectDeviceModel } from 'src/reducers/suite/suiteReducer';

export const useDeviceModel = (overrideDevice?: TrezorDevice) =>
    useSelector(state => selectDeviceModel(state, overrideDevice));
