import { atom, useAtom } from 'jotai';

const isDeviceManagerVisibleAtom = atom(false);

export const useDeviceManager = () => {
    const [isDeviceManagerVisible, setIsDeviceManagerVisible] = useAtom(isDeviceManagerVisibleAtom);

    return { isDeviceManagerVisible, setIsDeviceManagerVisible };
};
