import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-native';

import { Button } from '../../Button/Button';
import { BottomSheetModal } from '../../Sheet/BottomSheetModal';
import { useBottomSheetModal } from '../../Sheet/hooks/useBottomSheetModal';
import { VStack } from '../../Stack';
import { Text } from '../../Text';

type SheetName = 'parent' | 'child' | 'sibling';
type DismissCounts = Record<SheetName, number>;

const DismissCounters = ({
    counts,
    location,
}: {
    counts: DismissCounts;
    location: SheetName | 'root';
}) => (
    <Text testID={`@native-sheet-lifecycle/${location}/counts`}>
        Parent dismissed: {counts.parent}; child dismissed: {counts.child}; sibling dismissed:{' '}
        {counts.sibling}
    </Text>
);

type ParentContentProps = {
    counts: DismissCounts;
    closeParent: () => void;
    openSibling: () => void;
    onChildDismiss: () => void;
};

const ParentContent = ({
    counts,
    closeParent,
    openSibling,
    onChildDismiss,
}: ParentContentProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal({ isNestedSheet: true });

    return (
        <VStack spacing="sp16">
            <Text testID="@native-sheet-lifecycle/parent/content">Parent sheet is open.</Text>
            <DismissCounters counts={counts} location="parent" />
            <Button onPress={openModal} testID="@native-sheet-lifecycle/parent/open-child">
                Open nested child
            </Button>
            <Button onPress={closeParent} testID="@native-sheet-lifecycle/parent/close">
                Close parent
            </Button>
            <Button onPress={openSibling} testID="@native-sheet-lifecycle/parent/open-sibling">
                Replace parent with sibling
            </Button>
            <BottomSheetModal
                ref={bottomSheetRef}
                title="Lifecycle child"
                subtitle="Mounted inside the parent sheet"
                onDismiss={onChildDismiss}
            >
                <VStack spacing="sp16">
                    <Text testID="@native-sheet-lifecycle/child/content">
                        Child sheet is open above its parent.
                    </Text>
                    <DismissCounters counts={counts} location="child" />
                    <Button onPress={closeModal} testID="@native-sheet-lifecycle/child/close">
                        Close child only
                    </Button>
                    <Button
                        onPress={closeParent}
                        testID="@native-sheet-lifecycle/child/close-parent"
                    >
                        Close parent while child is open
                    </Button>
                    <Button
                        onPress={openSibling}
                        testID="@native-sheet-lifecycle/child/open-sibling"
                    >
                        Replace both with sibling
                    </Button>
                </VStack>
            </BottomSheetModal>
        </VStack>
    );
};

const LifecycleSheets = () => {
    const [counts, setCounts] = useState<DismissCounts>({ parent: 0, child: 0, sibling: 0 });
    const parent = useBottomSheetModal();
    const sibling = useBottomSheetModal();

    const recordDismiss = (name: SheetName) => {
        setCounts(previous => ({ ...previous, [name]: previous[name] + 1 }));
    };

    return (
        <VStack spacing="sp16">
            <Text>
                Local lifecycle test. Each dismissed sheet should increment its counter once.
            </Text>
            <DismissCounters counts={counts} location="root" />
            <Button onPress={parent.openModal} testID="@native-sheet-lifecycle/open-parent">
                Open parent
            </Button>
            <Button onPress={sibling.openModal} testID="@native-sheet-lifecycle/open-sibling">
                Open sibling
            </Button>
            <BottomSheetModal
                ref={parent.bottomSheetRef}
                title="Lifecycle parent"
                onDismiss={() => recordDismiss('parent')}
            >
                <ParentContent
                    counts={counts}
                    closeParent={parent.closeModal}
                    openSibling={sibling.openModal}
                    onChildDismiss={() => recordDismiss('child')}
                />
            </BottomSheetModal>
            <BottomSheetModal
                ref={sibling.bottomSheetRef}
                title="Lifecycle sibling"
                onDismiss={() => recordDismiss('sibling')}
            >
                <VStack spacing="sp16">
                    <Text testID="@native-sheet-lifecycle/sibling/content">
                        Sibling sheet is open. Parent and child should be closed.
                    </Text>
                    <DismissCounters counts={counts} location="sibling" />
                    <Button
                        onPress={sibling.closeModal}
                        testID="@native-sheet-lifecycle/sibling/close"
                    >
                        Close sibling
                    </Button>
                    <Button
                        onPress={parent.openModal}
                        testID="@native-sheet-lifecycle/sibling/open-parent"
                    >
                        Replace sibling with parent
                    </Button>
                </VStack>
            </BottomSheetModal>
        </VStack>
    );
};

const meta: Meta<typeof LifecycleSheets> = {
    title: 'Atoms/Native sheet QA',
    component: LifecycleSheets,
};

export default meta;

export const Lifecycle: StoryObj<typeof LifecycleSheets> = {};
