import { Box, Card, CardActionArea, CardContent, CardMedia, Container, Grid, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosterUrl } from '../api/tmdb';
import HomeActiveCard from '../components/HomeActiveCard';
import HomeMovieActiveCard from '../components/HomeMovieActiveCard';
import { useProgressStore } from '../store/useProgressStore';
import { STATUS_LABELS, type MovieRecord, type SeasonRecord } from '../types';

const HomePage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const records = useProgressStore((state) => state.data.records);

    const trackedItems = useMemo(() => {
        return Object.values(records)
            .filter((record) => record.global_status)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }, [records]);

    const itemsByStatus = useMemo(() => {
        const groups = {
            Do: [] as (SeasonRecord | MovieRecord)[],
            Wish: [] as (SeasonRecord | MovieRecord)[],
            Collect: [] as (SeasonRecord | MovieRecord)[],
            OnHold: [] as (SeasonRecord | MovieRecord)[],
            Dropped: [] as (SeasonRecord | MovieRecord)[],
        };
        trackedItems.forEach(item => {
            if (item.global_status) {
                groups[item.global_status].push(item);
            }
        });
        return groups;
    }, [trackedItems]);

    const handleCardClick = (record: SeasonRecord | MovieRecord) => {
        if (record.type === 'tv_season') {
            navigate(`/tv/${record.tmdb_id}`);
        } else {
            navigate(`/movie/${record.tmdb_id}`);
        }
    };

    const primary = theme.palette.primary.main;

    const renderCompactCard = (record: SeasonRecord | MovieRecord) => {
        const isTv = record.type === 'tv_season';
        const tvRecord = isTv ? (record as SeasonRecord) : null;

        // ShowName is priority. If not available, fallback to Name.
        const titleText = isTv
            ? (tvRecord?.show_name || tvRecord?.name || `剧集 ID: ${record.tmdb_id}`)
            : (record.name || `电影 ID: ${record.tmdb_id}`);

        const tagText = isTv ? (tvRecord?.name || `第 ${tvRecord?.season_number} 季`) : '电影';

        const key = `${record.type}-${record.tmdb_id}-${isTv ? tvRecord?.season_number : ''}`;

        return (
            <Grid key={key} sx={{ width: { xs: '50%', sm: '33.33%', md: '25%', lg: '20%' }, p: 1 }}>
                <Card
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'background.paper',
                        transition: 'transform 200ms ease, box-shadow 200ms ease',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        },
                    }}
                >
                    <CardActionArea
                        onClick={() => handleCardClick(record)}
                        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                    >
                        <Box sx={{ position: 'relative' }}>
                            {record.poster_path ? (
                                <CardMedia
                                    component="img"
                                    image={getPosterUrl(record.poster_path, 'w342')}
                                    alt={titleText}
                                    sx={{ aspectRatio: '2/3', objectFit: 'cover', backgroundColor: alpha('#fff', 0.05) }}
                                />
                            ) : (
                                <Box sx={{ aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(primary, 0.1) }}>
                                    <Typography variant="caption" color="primary">No Poster</Typography>
                                </Box>
                            )}
                        </Box>
                        <CardContent sx={{ flex: 1, p: 1.5, pb: '12px !important' }}>
                            <Typography variant="body2" fontWeight={700} noWrap title={titleText}>
                                {titleText}
                            </Typography>
                            {isTv && titleText !== tagText ? (
                                <Typography
                                    sx={{
                                        display: 'inline-block',
                                        backgroundColor: alpha(primary, 0.15),
                                        color: primary,
                                        px: 0.75,
                                        py: 0.25,
                                        borderRadius: 1,
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        mt: 0.5
                                    }}
                                >
                                    {tagText}
                                </Typography>
                            ) : (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    {tagText}
                                </Typography>
                            )}
                            {record.rating > 0 && (
                                <Typography variant="caption" sx={{ color: primary, fontWeight: 700, display: 'block', mt: 0.5 }}>
                                    ★ {record.rating}/10
                                </Typography>
                            )}
                        </CardContent>
                    </CardActionArea>
                </Card>
            </Grid>
        );
    };

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <Container maxWidth="lg" sx={{ pt: 2, pb: 6 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                    正在追踪
                </Typography>

                {trackedItems.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            还没有追踪任何项目
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            在右上角搜索喜欢的影视作品开始追踪
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        {/* Doing Section */}
                        {itemsByStatus.Do.length > 0 && (
                            <Box sx={{ mb: 6 }}>
                                {itemsByStatus.Do.map((record) => {
                                    if (record.type === 'tv_season') {
                                        return (
                                            <HomeActiveCard
                                                key={`do-tv-${record.tmdb_id}-${record.season_number}`}
                                                tvId={record.tmdb_id}
                                                seasonNumber={record.season_number}
                                                name={record.name}
                                                showName={(record as SeasonRecord).show_name}
                                                posterPath={record.poster_path}
                                                episodeCount={record.episode_count}
                                            />
                                        );
                                    } else {
                                        // Doing Movie -> use long-card layout, matching TV season cards
                                        const mvRecord = record as MovieRecord;
                                        return (
                                            <HomeMovieActiveCard
                                                key={`do-movie-${record.tmdb_id}`}
                                                movieId={record.tmdb_id}
                                                name={mvRecord.name}
                                                posterPath={mvRecord.poster_path}
                                            />
                                        );
                                    }
                                })}
                            </Box>
                        )}

                        {/* Other Statuses Shelves */}
                        {(['Wish', 'Collect', 'OnHold', 'Dropped'] as const).map((status) => {
                            const items = itemsByStatus[status];
                            if (items.length === 0) return null;

                            return (
                                <Box key={status} sx={{ mb: 5 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', '&::before': { content: '""', width: 4, height: 16, backgroundColor: primary, mr: 1, borderRadius: 1 } }}>
                                        {STATUS_LABELS[status]} ({items.length})
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {items.map(renderCompactCard)}
                                    </Grid>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default HomePage;
