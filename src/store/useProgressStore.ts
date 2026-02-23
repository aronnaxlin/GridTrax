import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    EpisodeRecord,
    MovieRecord,
    ProgressData,
    SeasonRecord,
    WatchStatus,
} from '../types';

interface ProgressState {
    data: ProgressData;
    // TV Season actions
    ensureSeasonRecord: (tvId: number, seasonNumber: number) => void;
    toggleEpisodeWatched: (tvId: number, seasonNumber: number, episodeNumber: number) => void;
    watchUpToEpisode: (tvId: number, seasonNumber: number, episodeNumber: number, totalEpisodes: number) => void;
    setEpisodeComment: (tvId: number, seasonNumber: number, episodeNumber: number, comment: string) => void;
    setSeasonStatus: (tvId: number, seasonNumber: number, status: WatchStatus) => void;
    setSeasonRating: (tvId: number, seasonNumber: number, rating: number) => void;
    setSeasonComment: (tvId: number, seasonNumber: number, comment: string) => void;
    // Movie actions
    ensureMovieRecord: (movieId: number) => void;
    setMovieStatus: (movieId: number, status: WatchStatus) => void;
    setMovieRating: (movieId: number, rating: number) => void;
    setMovieComment: (movieId: number, comment: string) => void;
    // Getters
    getSeasonRecord: (tvId: number, seasonNumber: number) => SeasonRecord | undefined;
    getMovieRecord: (movieId: number) => MovieRecord | undefined;
    getEpisodeRecord: (tvId: number, seasonNumber: number, episodeNumber: number) => EpisodeRecord;
}

const seasonKey = (tvId: number, seasonNumber: number) => `tmdb_tv_${tvId}_s${seasonNumber}`;
const movieKey = (movieId: number) => `tmdb_movie_${movieId}`;

const defaultSeasonRecord = (tvId: number, seasonNumber: number): SeasonRecord => ({
    type: 'tv_season',
    tmdb_id: tvId,
    season_number: seasonNumber,
    global_status: 'Wish',
    rating: 0,
    global_comment: '',
    episodes: {},
});

const defaultMovieRecord = (movieId: number): MovieRecord => ({
    type: 'movie',
    tmdb_id: movieId,
    global_status: 'Wish',
    rating: 0,
    global_comment: '',
});

const defaultEpisodeRecord = (): EpisodeRecord => ({ watched: false, comment: '' });

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            data: {
                user_id: 'local_user',
                last_sync: Date.now(),
                records: {},
            },

            ensureSeasonRecord: (tvId, seasonNumber) => {
                const key = seasonKey(tvId, seasonNumber);
                if (!get().data.records[key]) {
                    set((state) => ({
                        data: {
                            ...state.data,
                            records: {
                                ...state.data.records,
                                [key]: defaultSeasonRecord(tvId, seasonNumber),
                            },
                        },
                    }));
                }
            },

            toggleEpisodeWatched: (tvId, seasonNumber, episodeNumber) => {
                const key = seasonKey(tvId, seasonNumber);
                get().ensureSeasonRecord(tvId, seasonNumber);
                set((state) => {
                    const record = state.data.records[key] as SeasonRecord;
                    const epKey = String(episodeNumber);
                    const current = record.episodes[epKey] ?? defaultEpisodeRecord();
                    return {
                        data: {
                            ...state.data,
                            last_sync: Date.now(),
                            records: {
                                ...state.data.records,
                                [key]: {
                                    ...record,
                                    episodes: {
                                        ...record.episodes,
                                        [epKey]: { ...current, watched: !current.watched },
                                    },
                                },
                            },
                        },
                    };
                });
            },

            watchUpToEpisode: (tvId, seasonNumber, episodeNumber, totalEpisodes) => {
                const key = seasonKey(tvId, seasonNumber);
                get().ensureSeasonRecord(tvId, seasonNumber);
                set((state) => {
                    const record = state.data.records[key] as SeasonRecord;
                    const updatedEpisodes = { ...record.episodes };
                    // Mark all episodes from 1 to episodeNumber as watched
                    for (let i = 1; i <= Math.min(episodeNumber, totalEpisodes); i++) {
                        const epKey = String(i);
                        updatedEpisodes[epKey] = {
                            ...(updatedEpisodes[epKey] ?? defaultEpisodeRecord()),
                            watched: true,
                        };
                    }
                    return {
                        data: {
                            ...state.data,
                            last_sync: Date.now(),
                            records: {
                                ...state.data.records,
                                [key]: { ...record, episodes: updatedEpisodes },
                            },
                        },
                    };
                });
            },

            setEpisodeComment: (tvId, seasonNumber, episodeNumber, comment) => {
                const key = seasonKey(tvId, seasonNumber);
                get().ensureSeasonRecord(tvId, seasonNumber);
                set((state) => {
                    const record = state.data.records[key] as SeasonRecord;
                    const epKey = String(episodeNumber);
                    const current = record.episodes[epKey] ?? defaultEpisodeRecord();
                    return {
                        data: {
                            ...state.data,
                            records: {
                                ...state.data.records,
                                [key]: {
                                    ...record,
                                    episodes: { ...record.episodes, [epKey]: { ...current, comment } },
                                },
                            },
                        },
                    };
                });
            },

            setSeasonStatus: (tvId, seasonNumber, status) => {
                const key = seasonKey(tvId, seasonNumber);
                get().ensureSeasonRecord(tvId, seasonNumber);
                set((state) => ({
                    data: {
                        ...state.data,
                        records: {
                            ...state.data.records,
                            [key]: { ...(state.data.records[key] as SeasonRecord), global_status: status },
                        },
                    },
                }));
            },

            setSeasonRating: (tvId, seasonNumber, rating) => {
                const key = seasonKey(tvId, seasonNumber);
                get().ensureSeasonRecord(tvId, seasonNumber);
                set((state) => ({
                    data: {
                        ...state.data,
                        records: {
                            ...state.data.records,
                            [key]: { ...(state.data.records[key] as SeasonRecord), rating },
                        },
                    },
                }));
            },

            setSeasonComment: (tvId, seasonNumber, comment) => {
                const key = seasonKey(tvId, seasonNumber);
                get().ensureSeasonRecord(tvId, seasonNumber);
                set((state) => ({
                    data: {
                        ...state.data,
                        records: {
                            ...state.data.records,
                            [key]: { ...(state.data.records[key] as SeasonRecord), global_comment: comment },
                        },
                    },
                }));
            },

            ensureMovieRecord: (movieId) => {
                const key = movieKey(movieId);
                if (!get().data.records[key]) {
                    set((state) => ({
                        data: {
                            ...state.data,
                            records: {
                                ...state.data.records,
                                [key]: defaultMovieRecord(movieId),
                            },
                        },
                    }));
                }
            },

            setMovieStatus: (movieId, status) => {
                const key = movieKey(movieId);
                get().ensureMovieRecord(movieId);
                set((state) => ({
                    data: {
                        ...state.data,
                        records: {
                            ...state.data.records,
                            [key]: { ...(state.data.records[key] as MovieRecord), global_status: status },
                        },
                    },
                }));
            },

            setMovieRating: (movieId, rating) => {
                const key = movieKey(movieId);
                get().ensureMovieRecord(movieId);
                set((state) => ({
                    data: {
                        ...state.data,
                        records: {
                            ...state.data.records,
                            [key]: { ...(state.data.records[key] as MovieRecord), rating },
                        },
                    },
                }));
            },

            setMovieComment: (movieId, comment) => {
                const key = movieKey(movieId);
                get().ensureMovieRecord(movieId);
                set((state) => ({
                    data: {
                        ...state.data,
                        records: {
                            ...state.data.records,
                            [key]: { ...(state.data.records[key] as MovieRecord), global_comment: comment },
                        },
                    },
                }));
            },

            getSeasonRecord: (tvId, seasonNumber) => {
                const key = seasonKey(tvId, seasonNumber);
                return get().data.records[key] as SeasonRecord | undefined;
            },

            getMovieRecord: (movieId) => {
                const key = movieKey(movieId);
                return get().data.records[key] as MovieRecord | undefined;
            },

            getEpisodeRecord: (tvId, seasonNumber, episodeNumber) => {
                const key = seasonKey(tvId, seasonNumber);
                const record = get().data.records[key] as SeasonRecord | undefined;
                return record?.episodes[String(episodeNumber)] ?? defaultEpisodeRecord();
            },
        }),
        {
            name: 'gridtrax-progress',
        }
    )
);
