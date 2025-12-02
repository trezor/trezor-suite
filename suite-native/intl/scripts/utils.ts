import fs from 'fs';
export const writeMessagesObjectToFile = (messages: Record<string, any>, filePath: string) => {
    fs.writeFileSync(
        filePath,
        `
        // Few rules:
        // 1. Never use dynamic keys IDs for example: translate(\`module.graph.coin.\${symbol}\`) instead map it to static key: { btc: translate('module.graph.coin.btc') }
        // 2. Don't split string because of formatting or nested components use Rich Text Formatting instead https://formatjs.io/docs/react-intl/components#rich-text-formatting
        // 3. Always wrap keys per module/screen/feature for example: module.graph.legend
        
        export const messages = ${JSON.stringify(messages, null, 2)};`,
    );
};
