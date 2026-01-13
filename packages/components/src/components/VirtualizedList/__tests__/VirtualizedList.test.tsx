import React from 'react';

import { render, screen } from '@testing-library/react';

import { VirtualizedList } from '../VirtualizedList';

describe('VirtualizedList', () => {
    describe('type tests', () => {
        it('should throw type errors because local mock items lack the "height" property', () => {
            type MockItem = { id: number; content: string };
            const mockItems: MockItem[] = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                content: `Item ${i}`,
            }));

            <VirtualizedList
                // @ts-expect-error: correct error here, 'height' property not passed
                items={mockItems}
                listHeight={400}
                listMinHeight={400}
                // @ts-expect-error: correct error here, 'height' property not passed
                renderItem={(item: MockItem) => ({ id: item.id, content: item.content })}
                onScrollEnd={() => {}}
            />;
        });

        it('should render properly with items containing height property', () => {
            type MockItemWithHeight = { id: number; content: string; height: number };
            const mockItems: MockItemWithHeight[] = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                content: `Item ${i}`,
                height: 40,
            }));

            <VirtualizedList
                items={mockItems}
                listHeight={400}
                listMinHeight={400}
                renderItem={(item: MockItemWithHeight) => (
                    <div key={item.id} style={{ height: item.height }}>
                        {item.content}
                    </div>
                )}
                onScrollEnd={() => {}}
            />;
        });

        it('should automatically type the renderItem() parameter according to the passed generic', () => {
            type MockItemWithHeight = { id: number; content: string; height: number };
            const mockItems: MockItemWithHeight[] = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                content: `Item ${i}`,
                height: 40,
            }));

            <VirtualizedList
                items={mockItems}
                listHeight={400}
                listMinHeight={400}
                renderItem={item => {
                    const idNumber: number = item.id;

                    return (
                        <div key={idNumber} style={{ height: item.height }}>
                            {item.content}
                        </div>
                    );
                }}
                onScrollEnd={() => {}}
            />;
        });
    });

    describe('smoke tests', () => {
        it('renders without crashing with minimal props', () => {
            const mockItems = Array.from({ length: 3 }, (_, i) => ({
                id: i,
                content: `Test Item ${i}`,
                height: 40,
            }));

            render(
                <VirtualizedList
                    items={mockItems}
                    listHeight={200}
                    listMinHeight={200}
                    renderItem={item => (
                        <div key={item.id} data-testid={`item-${item.id}`}>
                            {item.content}
                        </div>
                    )}
                    onScrollEnd={() => {}}
                />,
            );

            // Verify the first item is rendered
            expect(screen.getByTestId('item-0')).toBeTruthy();
            expect(screen.getByText('Test Item 0')).toBeTruthy();
        });

        it('renders empty list without crashing', () => {
            const { container } = render(
                <VirtualizedList
                    items={[]}
                    listHeight={200}
                    listMinHeight={200}
                    renderItem={() => null}
                    onScrollEnd={() => {}}
                />,
            );

            expect(container.firstChild).toBeTruthy();
            expect(container.firstChild?.textContent).toBe('');
        });
    });

    describe('ref handling', () => {
        it('should properly accept and attach ref to the list container', () => {
            const mockItems = Array.from({ length: 3 }, (_, i) => ({
                id: i,
                content: `Test Item ${i}`,
                height: 40,
            }));

            const ref = React.createRef<HTMLDivElement>();

            render(
                <VirtualizedList
                    ref={ref}
                    items={mockItems}
                    listHeight={200}
                    listMinHeight={200}
                    renderItem={item => (
                        <div key={item.id} data-testid={`item-${item.id}`}>
                            {item.content}
                        </div>
                    )}
                    onScrollEnd={() => {}}
                />,
            );

            // Verify that the ref is attached to a div element
            expect(ref.current).toBeInstanceOf(HTMLDivElement);
            // Verify that the ref points to the container element
            expect(ref.current).toBeInTheDocument();
            // The container should have a specific height style
            expect(ref.current).toHaveStyle({ height: '200px' });
        });
    });
});
