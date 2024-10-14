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

export function repeatAction(fn: () => void, time = 180000): NodeJS.Timeout {
    fn();
    return setInterval(fn, time)
}

export function getQuestionNumber(filePath: string): string | null {
    const regexMatch = filePath.match(/[\\/](\d+)\./);
    if (!regexMatch || !regexMatch[1]) {
        return null;
    }
    return regexMatch[1];
}

export function getISODate(epochTime: number) {
    return new Date(epochTime).toISOString();
}
type LanguageRequest = "abap" | "agda" | "arduino" | "assembly" | "bash" | "basic" | "bnf" | "c" | "c#" | "c++" | "clojure" | "coffeescript" | "coq" | "css" | "dart" | "dhall" | "diff" | "docker" | "ebnf" | "elixir" | "elm" | "erlang" | "f#" | "flow" | "fortran" | "gherkin" | "glsl" | "go" | "graphql" | "groovy" | "haskell" | "html" | "idris" | "java" | "javascript" | "json" | "julia" | "kotlin" | "latex" | "less" | "lisp" | "livescript" | "llvm ir" | "lua" | "makefile" | "markdown" | "markup" | "matlab" | "mathematica" | "mermaid" | "nix" | "notion formula" | "objective-c" | "ocaml" | "pascal" | "perl" | "php" | "plain text" | "powershell" | "prolog" | "protobuf" | "purescript" | "python" | "r" | "racket" | "reason" | "ruby" | "rust" | "sass" | "scala" | "scheme" | "scss" | "shell" | "solidity" | "sql" | "swift" | "toml" | "typescript" | "vb.net" | "verilog" | "vhdl" | "visual basic" | "webassembly" | "xml" | "yaml" | "java/c/c++/c#";
export function getNotionLang(lang: string): LanguageRequest {
    const langMap: Record<string, LanguageRequest> = {
        "cpp": "c++",
        "java": "java",
        "python": "python",
        "python3": "python",
        "c": "c",
        "csharp": "c#",
        "javascript": "javascript",
        "typescript": "typescript",
        "php": "php",
        "swift": "swift",
        "kotlin": "kotlin",
        "dart": "dart",
        "golang": "go",
        "ruby": "ruby",
        "scala": "scala",
        "rust": "rust",
        "racket": "java/c/c++/c#",
        "erlang": "erlang",
        "elixir": "elixir",
        "mysql": "sql",
        "mssql": "sql",
        "oraclesql": "sql",
        "pythondata": "python",
        "postgresql": "sql",
        "bash": "bash"
    }
    lang = lang.toLowerCase();
    if (!langMap[lang]) {
        return 'java/c/c++/c#';
    } else {
        return langMap[lang];
    }
}

export function splitTextIntoChunks(text: string, chunkSize: number = 2000) {
    const chunks: Array<string> = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        chunks.push(chunk);
    }
    return chunks;
}
