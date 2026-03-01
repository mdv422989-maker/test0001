export const USER1 = process.env.NEXT_PUBLIC_USER1_NAME || "自分";
export const USER2 = process.env.NEXT_PUBLIC_USER2_NAME || "パートナー";

export const USERS = [USER1, USER2] as const;
