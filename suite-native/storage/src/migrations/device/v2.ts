interface OldDevice {
    state?: string;
    _state?: {
        staticSessionId?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

interface MigratedDevice {
    state?: {
        staticSessionId?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export const migrateDeviceState = (oldDevices: OldDevice[]): MigratedDevice[] =>
    oldDevices.map(device => {
        if (typeof device.state === 'string') {
            if (typeof device?._state?.staticSessionId === 'string') {
                // Has _state property, migrate to that

                return { ...device, state: device._state, _state: undefined };
            } else if (typeof device?.state === 'string') {
                // No _state property, create new object

                return {
                    ...device,
                    state: {
                        staticSessionId: device.state,
                    },
                };
            }
        }

        return { ...device, state: undefined };
    });
