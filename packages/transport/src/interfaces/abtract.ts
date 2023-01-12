import { TypedEmitter } from '../types/typed-emitter';

export type TransportInterfaceDevice<DeviceType> = {
    session?: null | string;
    path: string;
    device: DeviceType;
};

/**
 * This class defines shape for native transport interfaces (navigator.usb, etc)
 */
export abstract class TransportAbstractInterface<InterfaceType, DeviceType> extends TypedEmitter<{
    'transport-interface-change': TransportInterfaceDevice<DeviceType>[];
}> {
    protected transportInterface: InterfaceType;
    devices: TransportInterfaceDevice<DeviceType>[] = [];

    constructor({ transportInterface }: { transportInterface: InterfaceType }) {
        super();
        this.transportInterface = transportInterface;
    }

    // todo: consider return types
    abstract enumerate(): Promise<string[]>;
    abstract read(path: string): any;
    abstract write(path: string, buffers: Buffer): Promise<void>;
    abstract openDevice(path: string, first: boolean): Promise<void>;
    abstract closeDevice(path: string): Promise<void>;
}
