import { useState } from 'react';

import { VStack, Button, HStack } from '@suite-native/atoms';
import { FirmwareOperationStatus } from '@suite-common/firmware';

import { UpdateProgressIndicator } from './UpdateProgressIndicator';


// DEBUG ONLY:This component is useful for testing animation states of UpdateProgressIndicator
export const UpdateProgressIndicatorDemo = () => {
    const [status, setStatus] = useState<{
        isStarting: boolean;
        isError: boolean;
        operation: FirmwareOperationStatus['operation'] | null;
        progress: number;
    }>({
        isStarting: true,
        isError: false,
        operation: null,
        progress: 0,
    });

    return (
        <VStack alignItems="center" spacing="sp16">
            <UpdateProgressIndicator {...status} />
            <HStack spacing="sp8">
                <Button onPress={() => setStatus(s => ({ ...s, progress: s.progress + 10 }))}>
                    Increase progress
                </Button>
                <Button onPress={() => setStatus(s => ({ ...s, progress: s.progress - 10 }))}>
                    Decrease progress
                </Button>
            </HStack>
            <HStack spacing="sp8">
                <Button
                    onPress={() =>
                        setStatus({
                            isStarting: true,
                            isError: false,
                            operation: null,
                            progress: 0,
                        })
                    }
                >
                    Start
                </Button>
                <Button
                    onPress={() =>
                        setStatus({
                            isStarting: false,
                            isError: false,
                            operation: 'installing',
                            progress: 10,
                        })
                    }
                >
                    Progress
                </Button>
                <Button
                    onPress={() =>
                        setStatus({
                            isStarting: false,
                            isError: true,
                            operation: 'installing',
                            progress: 10,
                        })
                    }
                >
                    Error
                </Button>
                <Button
                    onPress={() =>
                        setStatus({
                            isStarting: false,
                            isError: false,
                            operation: 'completed',
                            progress: 10,
                        })
                    }
                >
                    Success
                </Button>
            </HStack>
        </VStack>
    );
};
