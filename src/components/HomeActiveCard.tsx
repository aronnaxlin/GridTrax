import { Box, Card, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosterUrl, getTVSeason } from '../api/tmdb';
import { useProgressStore } from '../store/useProgressStore';
import type { TMDBSeason } from '../types';
import EpisodeGrid from './EpisodeGrid';
import HomeQuickEdit from './HomeQuickEdit';

interface HomeActiveCardProps {
    tvId: number;
    seasonNumber: number;
    name?: string;
    showName?: string;
    posterPath?: string;
    episodeCount?: number;
}

const HomeActiveCard: React.FC<HomeActiveCardProps> = ({
    tvId,
    seasonNumber,
    name,
    showName,
    posterPath,
    episodeCount
}) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [season, setSeason] = useState<TMDBSeason | null>(null);

    const { getSeasonRecord } = useProgressStore();
    const record = getSeasonRecord(tvId, seasonNumber);

    useEffect(() => {
        getTVSeason(tvId, seasonNumber).then(setSeason);
    }, [tvId, seasonNumber]);

    const handleCardClick = () => {
        navigate(`/tv/${tvId}`);
    };

    const primary = theme.palette.primary.main;
    const titleText = showName || name || `剧集 ID: ${tvId}`;
    const tagText = name || `第 ${seasonNumber} 季`;
    const poster = posterPath ? getPosterUrl(posterPath, 'w154') : undefined;
    const meta = { name, show_name: showName, poster_path: posterPath, episode_count: episodeCount };

    return (
        <Card
            sx={{
                display: 'flex',
                flexDirection: 'column',
                mb: 3,
                borderRadius: 2,
                backgroundColor: alpha(primary, 0.03),
                border: `1px solid ${alpha(primary, 0.1)}`,
                transition: 'box-shadow 0.2s ease',
                '&:hover': {
                    boxShadow: `0 4px 20px ${alpha(primary, 0.1)}`,
                }
            }}
        >
            <Box sx={{ display: 'flex', p: 2 }}>
                {/* Poster */}
                <Box
                    sx={{ cursor: 'pointer', flexShrink: 0 }}
                    onClick={handleCardClick}
                >
                    {poster ? (
                        <Box
                            component="img"
                            src={poster}
                            alt={titleText}
                            sx={{ width: { xs: 64, sm: 80 }, aspectRatio: '2/3', height: 'auto', borderRadius: 1.5, objectFit: 'cover', mr: 2 }}
                        />
                    ) : (
                        <Box sx={{ width: { xs: 64, sm: 80 }, aspectRatio: '2/3', height: 'auto', borderRadius: 1.5, backgroundColor: alpha(primary, 0.1), mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="caption" color="primary">No Poster</Typography>
                        </Box>
                    )}
                </Box>

                {/* Info */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'pointer' }} onClick={handleCardClick}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" fontWeight={700}>{titleText}</Typography>
                        {tagText && titleText !== tagText && (
                            <Typography
                                component="span"
                                sx={{
                                    backgroundColor: primary,
                                    color: theme.palette.getContrastText(primary),
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                }}
                            >
                                {tagText}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {episodeCount ? `共 ${episodeCount} 集` : '在看'}
                        </Typography>
                        {record?.rating ? (
                            <Typography variant="body2" sx={{ color: primary, fontWeight: 700 }}>
                                ★ {record.rating}/10
                            </Typography>
                        ) : null}
                    </Box>
                </Box>

                {/* Quick Edit Button */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 0.5 }}>
                    <HomeQuickEdit
                        recordKey={`tv_${tvId}_s${seasonNumber}`}
                        type="tv_season"
                        tmdbId={tvId}
                        seasonNumber={seasonNumber}
                        meta={meta}
                    />
                </Box>
            </Box>

            <Box sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
                {season && (
                    <EpisodeGrid
                        tvId={tvId}
                        seasonNumber={seasonNumber}
                        episodes={season.episodes}
                        metaPayload={meta}
                    />
                )}
            </Box>
        </Card>
    );
};

export default HomeActiveCard;
