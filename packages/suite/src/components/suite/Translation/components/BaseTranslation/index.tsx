import React from 'react';
import { FormattedMessage, MessageDescriptor } from 'react-intl';
import messages from '@suite/support/messages';

export type TranslationKey = keyof typeof messages;
interface TooltipProps {
    isNested?: boolean;
    messageId: TranslationKey;
    children: any;
}

type OwnProps = {
    isNested?: boolean;
    isReactNative?: boolean; // used to render span on the web, plain node for react-native
    translationTooltip: React.ComponentType<TooltipProps>;
};

type PrimitiveType = string | number | boolean | Date | null | undefined;

// Add MessageDescriptor type to values entry
// eslint-disable-next-line @typescript-eslint/ban-types
type FormatXMLElementFn = (...args: any[]) => string | object;
export interface ExtendedMessageDescriptor extends MessageDescriptor {
    id: TranslationKey;
    values?: {
        [key: string]:
            | PrimitiveType
            | React.ReactElement
            | ExtendedMessageDescriptor
            | FormatXMLElementFn;
    };
}
type MsgType = OwnProps & ExtendedMessageDescriptor;

export const isMsgType = (props: MsgType | React.ReactNode): props is MsgType =>
    typeof props === 'object' && props !== null && (props as MsgType).id !== undefined;

const BaseTranslation = (props: MsgType) => {
    const TooltipComponent = props.translationTooltip;
    const values: Record<string, PrimitiveType | React.ReactNode | ExtendedMessageDescriptor> = {};
    // message passed via props (id, defaultMessage, values)
    Object.keys(props.values || []).forEach(key => {
        // Iterates through all values. The entry may also contain a MessageDescriptor.
        // If so, Renders MessageDescriptor by passing it to `Translation` component
        const maybeMsg = props.values![key];
        values[key] = isMsgType(maybeMsg) ? (
            <BaseTranslation {...maybeMsg} translationTooltip={props.translationTooltip} isNested />
        ) : (
            maybeMsg
        );
    });

    // prevent runtime errors
    if (
        !props.defaultMessage &&
        Object.prototype.hasOwnProperty.call(props, 'id') &&
        !messages[props.id]
    ) {
        return <>{`Unknown translation id: ${props.id}`}</>;
    }

    const defaultTagName = props.isReactNative || props.isNested ? undefined : 'span';

    return (
        <TooltipComponent isNested={props.isNested} messageId={props.id}>
            <FormattedMessage
                id={props.id}
                tagName={defaultTagName}
                defaultMessage={props.defaultMessage || messages[props.id].defaultMessage}
                // pass undefined to a 'values' prop in case of an empty values object
                values={Object.keys(values).length === 0 ? undefined : values}
            />
        </TooltipComponent>
    );
};

export default BaseTranslation;
