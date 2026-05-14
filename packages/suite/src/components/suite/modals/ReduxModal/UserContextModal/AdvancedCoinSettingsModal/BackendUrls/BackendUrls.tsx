import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Button, Column, DotIndicator, Input, List, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDefaultUrls } from 'src/hooks/settings/backends';
import { type BackendsForm } from 'src/hooks/settings/backends/useBackendsForm';
import { useSelector } from 'src/hooks/suite';

type BackendUrlsProps = {
    symbol: NetworkSymbol;
    isEditable: boolean;
} & Pick<BackendsForm, 'input' | 'urls' | 'addUrl' | 'removeUrl'>;

export function BackendUrls({
    symbol,
    isEditable,
    input,
    urls,
    addUrl,
    removeUrl,
}: BackendUrlsProps) {
    const blockchain = useSelector(state => state.wallet.blockchain);
    const { data: defaultUrls } = useDefaultUrls(symbol);

    const { ref: inputRef, ...inputField } = input.register(input.name, {
        validate: input.validate,
    });

    return (
        <Column gap={spacings.xxl}>
            {(urls.length || (!isEditable && defaultUrls.length)) && (
                <List bulletComponent={<DotIndicator />} gap={spacings.sm}>
                    {(isEditable ? urls : defaultUrls).map(url => (
                        <List.Item
                            data-testid="@settings/advance/url"
                            key={url}
                            bulletComponent={
                                url === blockchain[symbol]?.url ? (
                                    <DotIndicator isActive />
                                ) : undefined
                            }
                        >
                            <Row gap={spacings.sm}>
                                <Text
                                    overflowWrap="anywhere"
                                    intent="neutral"
                                    priority={
                                        url === blockchain[symbol]?.url ? 'primary' : 'secondary'
                                    }
                                >
                                    {url}
                                </Text>
                                {isEditable && (
                                    <Button
                                        intent="neutral"
                                        priority="secondary"
                                        size="small"
                                        iconLeft="trash"
                                        onClick={() => removeUrl(url)}
                                    >
                                        <Translation id="TR_REMOVE" />
                                    </Button>
                                )}
                            </Row>
                        </List.Item>
                    ))}
                </List>
            )}
            {isEditable && (
                <Column gap={spacings.sm}>
                    <Input
                        data-testid="@settings/advance/url"
                        placeholder={input.placeholder}
                        hasError={!!input.error}
                        bottomText={input.error?.message || null}
                        innerRef={inputRef}
                        maxLength={2048}
                        rightContent={
                            <Button
                                intent="brand"
                                size="small"
                                iconLeft="plus"
                                data-testid="@settings/advance/button/add"
                                onClick={() => {
                                    addUrl(input.value);
                                    input.reset();
                                }}
                                isDisabled={!!input.error || input.value === ''}
                            >
                                <Translation id="TR_ADD_NEW_BLOCKBOOK_BACKEND" />
                            </Button>
                        }
                        {...inputField}
                    />
                </Column>
            )}
        </Column>
    );
}
