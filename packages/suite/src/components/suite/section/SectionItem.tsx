import { HTMLAttributes, forwardRef } from 'react';

import { Flex } from '@trezor/components';

import { OutlineHighlight } from 'src/components/OutlineHighlight';
import { useLayoutSize } from 'src/hooks/suite';

interface SectionItemProps extends HTMLAttributes<HTMLDivElement> {
    shouldHighlight?: boolean;
}

export const SectionItem = forwardRef<HTMLDivElement, SectionItemProps>(
    ({ children, shouldHighlight, ...rest }, ref) => {
        const { isBelowMobile } = useLayoutSize();

        return (
            <div ref={ref} {...rest}>
                <OutlineHighlight shouldHighlight={shouldHighlight}>
                    <Flex
                        direction={isBelowMobile ? 'column' : 'row'}
                        alignItems={isBelowMobile ? 'normal' : 'center'}
                    >
                        {children}
                    </Flex>
                </OutlineHighlight>
            </div>
        );
    },
);
