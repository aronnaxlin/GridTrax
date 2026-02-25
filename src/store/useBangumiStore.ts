import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BangumiState {
    token: string;
    username: string;
    userId: number | null;
    nickname: string;
    lastSyncAt: number | null;
    setToken: (token: string) => void;
    setUserInfo: (info: { username: string; userId: number; nickname: string }) => void;
    clearUser: () => void;
}

export const useBangumiStore = create<BangumiState>()(
    persist(
        (set) => ({
            token: '',
            username: '',
            userId: null,
            nickname: '',
            lastSyncAt: null,
            setToken: (token) => set({ token }),
            setUserInfo: ({ username, userId, nickname }) =>
                set({ username, userId, nickname }),
            clearUser: () =>
                set({ token: '', username: '', userId: null, nickname: '' }),
        }),
        { name: 'gridtrax-bangumi' }
    )
);
