import { ReactNode, useMemo } from 'react';
import { RefCallBack } from 'react-hook-form';

import { Explorer } from '@suite-common/wallet-config';
import { Button, Column, InfoItem, Input, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useExplorerForm } from 'src/hooks/settings/useExplorerForm';

type InputRowProps = {
    value: { ref: RefCallBack; field: Omit<RefCallBack, 'ref'>; error?: string };
    title: ReactNode;
    placeholder: string;
    base: string;
    defaultBase: string;
};

const InputRow = ({ value, title, placeholder, base, defaultBase }: InputRowProps) => (
    <InfoItem label={title}>
        <Row gap={spacings.sm} alignItems="flex-start">
            <Input value={base} type="text" placeholder={defaultBase} isDisabled={true} />

            <Text variant="tertiary" margin={{ top: spacings.md }}>
                /
            </Text>

            <Input
                type="text"
                innerRef={value.ref}
                inputState={value.error ? 'error' : undefined}
                bottomText={value.error}
                placeholder={placeholder}
                {...value.field}
            />
        </Row>
    </InfoItem>
);

type ExplorerConfigProps = {
    form: ReturnType<typeof useExplorerForm>;
};

export const ExplorerConfigForm = ({ form }: ExplorerConfigProps) => {
    const { explorerConfig, setDefaultValues, usesDefaultExplorer, input, explorer } = form;

    const explorerKeys = useMemo(() => {
        const keys = Object.keys(explorer) as (keyof Explorer)[];

        return keys.filter(key => key !== 'base' && input.fields[key].value !== undefined);
    }, [explorer, input]);

    const getInputTranslation = (key: keyof Explorer) => {
        switch (key) {
            case 'tx':
                return <Translation id="TR_EXPLORER_TX" />;
            case 'account':
                return <Translation id="TR_EXPLORER_ACCOUNT" />;
            case 'address':
                return <Translation id="TR_EXPLORER_ADDRESS" />;
            case 'nft':
                return <Translation id="TR_EXPLORER_NFT" />;
            case 'token':
                return <Translation id="TR_EXPLORER_TOKEN" />;
            case 'queryString':
                return <Translation id="TR_EXPLORER_QUERY_STRING" />;
        }
    };

    return (
        <Column gap={spacings.sm}>
            <InfoItem label={<Translation id="TR_EXPLORER_BASE_URL" />}>
                <Input
                    type="text"
                    placeholder={explorerConfig.default.base}
                    innerRef={input.fields.base.ref}
                    inputState={input.fields.base.error ? 'error' : undefined}
                    bottomText={input.fields.base.error}
                    innerAddon={
                        <Button
                            variant="tertiary"
                            size="small"
                            icon="change"
                            isDisabled={usesDefaultExplorer}
                            onClick={setDefaultValues}
                        >
                            <Translation id="TR_EXPLORER_SET_DEFAULT" />
                        </Button>
                    }
                    {...input.fields.base.field}
                />
            </InfoItem>

            {explorerKeys.map(key => (
                <InputRow
                    key={key}
                    value={input.fields[key]}
                    title={getInputTranslation(key)}
                    placeholder={explorerConfig.default[key] ?? ''}
                    base={input.fields['base'].value}
                    defaultBase={explorerConfig.default.base}
                />
            ))}
        </Column>
    );
};
