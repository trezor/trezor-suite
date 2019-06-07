import { TrezorDevice } from '@suite/types';

// get selected device from reducer
export const getSelectedDevice = (device: TrezorDevice, devices: TrezorDevice[]) => {
    // selected device is unacquired
    if (!device.features) return devices.find(d => d.path === device.path);

    return devices.find(d => {
        if (!d.features && d.path === device.path) {
            return true;
        }
        if (d.type === 'acquired' && d.mode === 'bootloader' && d.path === device.path) {
            return true;
        }
        if (
            d.features &&
            d.features.device_id === device.features.device_id
            // && d.instance === instance
        ) {
            return true;
        }
        return false;
    });
};

export const observeChanges = (
    prev: any,
    current: any,
    filter?: { [k: string]: string[] },
): boolean => {
    // 1. both objects are the same (solves simple types like string, boolean and number)
    if (prev === current) return false;
    // 2. one of the objects is null/undefined
    if (!prev || !current) return true;

    const prevType = Object.prototype.toString.call(prev);
    const currentType = Object.prototype.toString.call(current);
    // 3. one of the objects has different type then other
    if (prevType !== currentType) return true;

    if (currentType === '[object Array]') {
        // 4. Array length is different
        if (prev.length !== current.length) return true;
        // observe array recursive
        for (let i = 0; i < current.length; i++) {
            if (observeChanges(prev[i], current[i], filter)) return true;
        }
    } else if (currentType === '[object Object]') {
        const prevKeys = Object.keys(prev);
        const currentKeys = Object.keys(current);
        // 5. simple validation of keys length
        if (prevKeys.length !== currentKeys.length) return true;

        // 6. "prev" has keys which "current" doesn't have
        const prevDifference = prevKeys.find(k => currentKeys.indexOf(k) < 0);
        if (prevDifference) return true;

        // 8. observe every key recursive
        for (let i = 0; i < currentKeys.length; i++) {
            const key = currentKeys[i];
            if (
                filter &&
                Object.prototype.isPrototypeOf.call(filter, key) &&
                prev[key] &&
                current[key]
            ) {
                const prevFiltered: any = {};
                const currentFiltered: any = {};
                for (let i2 = 0; i2 < filter[key].length; i2++) {
                    const field = filter[key][i2];
                    prevFiltered[field] = prev[key][field];
                    currentFiltered[field] = current[key][field];
                }
                if (observeChanges(prevFiltered, currentFiltered)) return true;
            } else if (observeChanges(prev[key], current[key])) {
                return true;
            }
        }
    } else if (prev !== current) {
        // solve simple types like string, boolean and number
        return true;
    }

    return false;
};
