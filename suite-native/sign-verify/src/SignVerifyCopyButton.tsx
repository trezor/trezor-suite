import { IconButton } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';

type SignVerifyCopyButtonProps = {
    value: string;
};

export const SignVerifyCopyButton = ({ value }: SignVerifyCopyButtonProps) => {
    const copyToClipboard = useCopyToClipboard();

    return <IconButton iconName="copy" size="small" onPress={() => copyToClipboard(value)} />;
};
