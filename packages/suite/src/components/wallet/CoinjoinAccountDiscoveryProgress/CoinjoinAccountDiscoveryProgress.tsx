import { selectSelectedAccountKey } from '@suite/account';

import { useSelector } from 'src/hooks/suite';

import { DiscoveryProgressCard } from './DiscoveryProgressCard';

export const CoinjoinAccountDiscoveryProgress = () => {
    const accountKey = useSelector(selectSelectedAccountKey);

    // Another account's discovery starts from scratch: its progress, captions and illustration.
    return <DiscoveryProgressCard key={accountKey} />;
};
