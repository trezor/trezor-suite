import { useState } from 'react';

export type WalletBackupType = 'single-share' | 'multi-share' | '12-words' | '24-words';

export const walletOptions: WalletBackupType[] = [
    'single-share',
    'multi-share',
    '12-words',
    '24-words',
];

export const useWalletBackupPicker = () => {
    const [selectedType, setSelectedType] = useState<WalletBackupType>('single-share');

    return {
        selectedType,
        setSelectedType,
    };
};
