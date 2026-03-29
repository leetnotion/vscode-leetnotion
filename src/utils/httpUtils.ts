import axios, { AxiosPromise, AxiosRequestConfig } from 'axios';
import { omit } from 'lodash';
import { globalState } from '../globalState';
import { extractCookie } from './toolUtils';
import { DialogType, promptForOpenOutputChannel } from './uiUtils';

const referer = 'vscode-lc-extension';

export function LcAxios<T = any>(path: string, settings?: AxiosRequestConfig): AxiosPromise<T> {
	const cookie = globalState.getCookie();
	if (!cookie) {
		promptForOpenOutputChannel(
			`Failed to obtain the cookie. Please log in again.`,
			DialogType.error,
		);
		return Promise.reject('Failed to obtain the cookie.');
	}
	const { csrf, session } = extractCookie(cookie);
	if (!csrf || !session) {
		promptForOpenOutputChannel(
			`Invalid cookie format: missing csrftoken or LEETCODE_SESSION. Please log in again.`,
			DialogType.error,
		);
		return Promise.reject('Invalid cookie format.');
	}
	const validatedCookie = `csrftoken=${csrf}; LEETCODE_SESSION=${session}`;
	return axios(path, {
		headers: {
			referer,
			'content-type': 'application/json',
			cookie: validatedCookie,
			...(settings && settings.headers),
		},
		xsrfCookieName: 'csrftoken',
		xsrfHeaderName: 'X-CSRFToken',
		...(settings && omit(settings, 'headers')),
	});
}
