import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { log } from '../logger';
import { CONTEXT_IMAGES_DIR, CONTEXT_IMAGES_RELATIVE_DIR } from './paths';

const MAX_CONTEXT_IMAGES = 10;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const GITHUB_ATTACHMENT_PATH = /^\/user-attachments\/assets\/[0-9a-f-]+\/?$/i;
const IMAGE_FILE_EXTENSION = /\.(png|jpe?g|gif|webp)$/i;
const GITHUB_CDN_HOSTS = new Set([
    'private-user-images.githubusercontent.com',
    'user-images.githubusercontent.com',
]);
// GitHub user-attachments 302 to this S3 host (or the githubusercontent CDN).
const GITHUB_S3_HOST = /^github-production-user-asset-[a-z0-9]+\.s3\.amazonaws\.com$/;

function isGithubAttachmentUrl(url: URL): boolean {
    return (
        (url.hostname === 'github.com' && GITHUB_ATTACHMENT_PATH.test(url.pathname)) ||
        (GITHUB_CDN_HOSTS.has(url.hostname) && IMAGE_FILE_EXTENSION.test(url.pathname))
    );
}

function isAllowedRedirect(url: URL): boolean {
    return isGithubAttachmentUrl(url) || GITHUB_S3_HOST.test(url.hostname);
}

function collectAttachmentUrls(texts: string[]): string[] {
    const attachmentUrls: string[] = [];

    for (const text of texts) {
        for (const rawUrl of text.match(/https?:\/\/[^\s"'<>)]+/g) ?? []) {
            const urlWithoutTrailingPunctuation = rawUrl.replace(/[.,;:]+$/, '');
            if (!URL.canParse(urlWithoutTrailingPunctuation)) {
                continue;
            }

            const parsedUrl = new URL(urlWithoutTrailingPunctuation);
            if (
                isGithubAttachmentUrl(parsedUrl) &&
                !attachmentUrls.includes(urlWithoutTrailingPunctuation)
            ) {
                attachmentUrls.push(urlWithoutTrailingPunctuation);
            }

            if (attachmentUrls.length === MAX_CONTEXT_IMAGES) {
                return attachmentUrls;
            }
        }
    }

    return attachmentUrls;
}

function extensionFromContentType(contentType: string): string | null {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
    if (contentType.includes('gif')) return '.gif';
    if (contentType.includes('webp')) return '.webp';
    if (contentType.includes('png')) return '.png';

    return null;
}

export async function downloadAttachmentImages(texts: string[]): Promise<string[]> {
    rmSync(CONTEXT_IMAGES_DIR, { recursive: true, force: true });
    mkdirSync(CONTEXT_IMAGES_DIR, { recursive: true });

    const savedPaths: string[] = [];

    for (const url of collectAttachmentUrls(texts)) {
        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) {
            throw new Error(`attachment ${url} returned ${response.status}`);
        }

        if (!isAllowedRedirect(new URL(response.url))) {
            throw new Error(`attachment redirected outside GitHub: ${response.url}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType === null) {
            throw new Error(`attachment ${url} is missing content-type`);
        }

        const extension = extensionFromContentType(contentType);
        if (extension === null) {
            log(`[context] skipped ${url} (content-type: ${contentType})`);
            continue;
        }

        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.byteLength > MAX_ATTACHMENT_BYTES) {
            throw new Error(`attachment exceeds ${MAX_ATTACHMENT_BYTES} bytes`);
        }

        const name = `${savedPaths.length + 1}${extension}`;
        const relativePath = `${CONTEXT_IMAGES_RELATIVE_DIR}/${name}`;

        writeFileSync(join(CONTEXT_IMAGES_DIR, name), bytes);
        savedPaths.push(relativePath);
        log(`[context] saved ${relativePath}`);
    }

    return savedPaths;
}
