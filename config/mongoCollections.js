import { dbConnection } from "./mongoConnection.js";

const getCollectionFn = (collection) => {
    let _col;

    return async () => {
        if (!_col) {
            const db = await dbConnection();
            _col = await db.collection(collection);
        }
        return _col;
    };
};

// Export your app's collections
export const users = getCollectionFn("users");
export const posts = getCollectionFn("posts");
export const games = getCollectionFn("games");
export const teammates = getCollectionFn("teammates");
export const achievementDefinitions = getCollectionFn("achievementDefinitions");
export const notifications = getCollectionFn("notifications");

