import { View as MockView } from 'react-native';

jest.mock('./Skeleton/BoxSkeleton', () => ({
    BoxSkeleton: props => <MockView {...props} testID="BoxSkeleton" />,
}));
