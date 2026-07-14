import source from "./friends.toml?raw";
import { parseFriendsDocument } from "../lib/friends";

export const friends = parseFriendsDocument(source);
