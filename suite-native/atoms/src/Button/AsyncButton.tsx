import { useState } from 'react';

import { Button, type ButtonProps } from './Button';

export type AsyncButtonProps = Exclude<ButtonProps, 'isLoading' | 'onPress'> & {
    onPress: () => Promise<void>;
    onReject?: (error: unknown) => void;
};

export const AsyncButton = ({ onPress, onReject, ...props }: AsyncButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handlePress = async () => {
        setIsLoading(true);
        try {
            await onPress();
        } catch (error) {
            onReject?.(error);
        }
        setIsLoading(false);
    };

    return <Button {...props} isLoading={isLoading} onPress={handlePress} />;
};
