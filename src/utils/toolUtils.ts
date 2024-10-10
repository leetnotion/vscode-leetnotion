import { ICredential } from "@leetnotion/leetcode-api";

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseQuery(query: string): { [key: string]: string } {
    const queryObject: { [key: string]: string } = {};

    if (!query) {
        return queryObject;
    }

    const keyValuePairs = query.split("&");
    keyValuePairs.forEach((pair) => {
        const firstEqualsIndex = pair.indexOf("=");
        if (firstEqualsIndex !== -1) {
            const key = pair.substring(0, firstEqualsIndex);
            const value = pair.substring(firstEqualsIndex + 1);
            queryObject[decodeURIComponent(key)] = decodeURIComponent(value);
        } else {
            // If no equals sign is found, treat the whole string as key with empty value
            queryObject[decodeURIComponent(pair)] = "";
        }
    });

    return queryObject;
}

export function extractCookie(cookie: string): ICredential {
    const cookies = cookie.split(';');
    let csrf = '';
    let session = '';

    cookies.forEach(individualCookie => {
        const [key, value] = individualCookie.trim().split('=');
        if (key === 'csrftoken') {
            csrf = value;
        } else if (key === 'LEETCODE_SESSION') {
            session = value;
        }
    });
    return { csrf, session };
}
