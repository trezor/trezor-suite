import { useSelector } from './useSelector';
import { TrezorDevice } from '@suite-types/index';
import { selectDeviceModel } from '@suite-reducers/suiteReducer';

export const useDeviceModel = (overrideDevice?: TrezorDevice) =>
    useSelector(state => selectDeviceModel(state, overrideDevice));
