import { useSharedValue } from 'react-native-reanimated';

import { AccordionItem, AccordionItemProps } from './AccordionItem';
import { VStack } from '../Stack';

type AccordionListProps = {
    items: Omit<AccordionItemProps, 'currentIndexOpened' | 'index' | 'isDividerDisplayed'>[];
};

export const AccordionList = ({ items }: AccordionListProps) => {
    const openedAccordionIndex = useSharedValue<number | null>(null); // only one item can be opened at a time

    return (
        <VStack spacing="sp16">
            {items.map((accordion, index) => (
                <AccordionItem
                    key={index}
                    currentIndexOpened={openedAccordionIndex}
                    index={index}
                    isDividerDisplayed={index !== items.length - 1}
                    {...accordion}
                />
            ))}
        </VStack>
    );
};
