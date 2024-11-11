export const resolveStaticPath = (
    path: string,
    pathPrefix: string | undefined = process.env.ASSET_PREFIX,
) => `${pathPrefix || ''}/static/${path.replace(/^\/+/, '')}`;

export const resolveConnectPath = (
    path: string,
    pathPrefix: string | undefined = process.env.ASSET_PREFIX,
) => `${pathPrefix || ''}/${path.replace(/^\/+/, '')}`;
