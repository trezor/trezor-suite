import { useState } from 'react';

import { VStack, Button, HStack } from '@suite-native/atoms';

import { UpdateProgressIndicator, UpdateProgressIndicatorStatus } from './UpdateProgressIndicator';

// DEBUG ONLY:This component is useful for testing animation states of UpdateProgressIndicator
export const UpdateProgressIndicatorDemo = () => {
    const [status, setStatus] = useState<{
        status: UpdateProgressIndicatorStatus;
        progress: number;
    }>({
        status: 'starting',
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
                            status: 'starting',
                            progress: 0,
                        })
                    }
                >
                    Start
                </Button>
                <Button
                    onPress={() =>
                        setStatus({
                            status: 'inProgress',
                            progress: 10,
                        })
                    }
                >
                    Progress
                </Button>
                <Button
                    onPress={() =>
                        setStatus({
                            status: 'error',
                            progress: 10,
                        })
                    }
                >
                    Error
                </Button>
                <Button
                    onPress={() =>
                        setStatus({
                            status: 'success',
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
