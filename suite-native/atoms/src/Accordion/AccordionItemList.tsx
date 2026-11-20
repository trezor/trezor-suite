import { type ReactNode } from 'react';

import { BulletList } from '../List/BulletList';

type AccordionItemListProps = {
    children: ReactNode;
};

export const AccordionItemList = ({ children }: AccordionItemListProps) => (
    <BulletList textVariant="body-sm" textColor="contentSecondary">
        {children}
    </BulletList>
);
