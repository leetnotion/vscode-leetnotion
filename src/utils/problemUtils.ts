import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { IProblem, langExt } from '../shared';

export function genFileExt(language: string): string {
	const ext: string | undefined = langExt.get(language);
	if (!ext) {
		throw new Error(`The language "${language}" is not supported.`);
	}
	return ext;
}

export function genFileName(node: IProblem, language: string): string {
	const slug: string = node.slug || _.kebabCase(node.name);
	const ext: string = genFileExt(language);
	return `${node.id}.${slug}.${ext}`;
}

export async function getNodeIdFromFile(fsPath: string): Promise<string> {
	const fileContent: string = await fse.readFile(fsPath, 'utf8');
	let id: string = '';
	const matchResults: RegExpMatchArray | null = fileContent.match(/@lc.+id=(.+?) /);
	if (matchResults && matchResults.length === 2) {
		id = matchResults[1];
	}
	// Try to get id from file name if getting from comments failed
	if (!id) {
		id = path.basename(fsPath).split('.')[0];
	}

	return id;
}

export function getLangFromFile(fileContent: string): string | null {
	const match = fileContent.match(/@lc\s+app=\S+\s+id=\S+\s+lang=(\S+)/);
	return match ? match[1] : null;
}

export function extractCode(fileContent: string): string {
	const lines = fileContent.split(/\r?\n/);
	const start = lines.findIndex((x) => x.indexOf('@lc code=start') !== -1);
	const end = lines.findIndex((x) => x.indexOf('@lc code=end') !== -1);
	if (start !== -1 && end !== -1 && start + 1 <= end) {
		return lines.slice(start + 1, end).join('\n');
	}
	return fileContent;
}
