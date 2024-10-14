import { memo } from 'react';
import { Button, Text, View } from 'react-native';

import { useQuery, useEvolu } from '@evolu/react-native';

import {
    todosWithCategories,
    Database,
    TodoCategoryForSelect,
    TodoTable,
} from '@suite-native/evolu';

const TodoItem = memo<{
    row: Pick<TodoTable, 'id' | 'title' | 'isCompleted' | 'categoryId'> & {
        categories: ReadonlyArray<TodoCategoryForSelect>;
    };
}>(function TodoItem({ row: { id, title, isCompleted } }) {
    const { update } = useEvolu<Database>();

    return (
        <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row' }}>
                <Text>{title}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
                <Button
                    title={isCompleted ? 'Completed' : 'Complete'}
                    onPress={() => {
                        update('todo', { id, isCompleted: !isCompleted });
                    }}
                />
                <Button
                    title="Delete"
                    onPress={() => {
                        update('todo', { id, isDeleted: true });
                    }}
                />
            </View>
        </View>
    );
});

export const Evolu = () => {
    const { rows } = useQuery(todosWithCategories);
    console.log('rows', rows);

    return (
        <View>
            <Text>HELLO evolu</Text>
            <Text>HELLO evolu</Text>
            <Text>HELLO evolu</Text>
            <Text>HELLO evolu</Text>
            <Text>HELLO evolu</Text>
            <Text>HELLO evolu</Text>
            {rows.map(row => (
                <TodoItem key={row.id} row={row} />
            ))}
        </View>
    );
};
