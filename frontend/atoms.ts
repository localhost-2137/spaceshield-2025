import { atom } from "jotai";
import { drone } from "./interfaces";

const dronesAtom = atom<drone[]>([]);

export { dronesAtom };
