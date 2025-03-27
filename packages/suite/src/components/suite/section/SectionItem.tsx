import { HTMLAttributes, forwardRef } from 'react';

import { Flex, useMediaQuery, variables } from '@trezor/components';

import { OutlineHighlight } from 'src/components/OutlineHighlight';

interface SectionItemProps extends HTMLAttributes<HTMLDivElement> {
    shouldHighlight?: boolean;
}

export const SectionItem = forwardRef<HTMLDivElement, SectionItemProps>(
    ({ children, shouldHighlight, ...rest }, ref) => {
        const isBelowMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.SM})`);

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
