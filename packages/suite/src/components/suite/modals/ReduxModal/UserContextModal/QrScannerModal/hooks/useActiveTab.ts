import { useState } from 'react';

export type QRScannerTab = 'camera' | 'image';

export function useActiveTab(initialTab: QRScannerTab) {
    const [activeTab, setActiveTab] = useState<QRScannerTab>(initialTab);

    return { activeTab, setActiveTab };
}
