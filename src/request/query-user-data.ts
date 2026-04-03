import { UserDataType } from '../globalState';
import { urls } from '../shared';
import { LcAxios } from '../utils/httpUtils';

const graphqlStr = `
    query globalData {
        userStatus {
            isPremium
            isVerified
            username
            avatar
            isSignedIn
        }
    }
`;

export const queryUserData = async (): Promise<UserDataType> => {
	return LcAxios(urls.userGraphql, {
		method: 'POST',
		data: {
			query: graphqlStr,
			variables: {},
		},
	}).then((res) => res.data.data.userStatus);
};
