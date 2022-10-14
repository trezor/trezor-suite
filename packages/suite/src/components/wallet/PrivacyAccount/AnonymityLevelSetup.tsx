import React, { useRef, useState, useCallback } from 'react';
import { useOnClickOutside } from '@trezor/react-utils';

import { AnonymityLevelIndicator } from './AnonymityLevelIndicator';
import { AnonymityLevelSetupCard } from './AnonymityLevelSetupCard';

interface AnonymityLevelSetupProps {
    className?: string;
}

export const AnonymityLevelSetup = ({ className }: AnonymityLevelSetupProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const setupCardRef = useRef<HTMLDivElement>(null);

    const handleClick = useCallback(() => setIsOpen(prevState => !prevState), []);
    const handleClickOutside = useCallback(() => setIsOpen(false), []);

    useOnClickOutside([indicatorRef, setupCardRef], handleClickOutside);

    return (
        <div className={className}>
            <AnonymityLevelIndicator onClick={handleClick} ref={indicatorRef} />
            {isOpen && <AnonymityLevelSetupCard ref={setupCardRef} />}
        </div>
    );
};
