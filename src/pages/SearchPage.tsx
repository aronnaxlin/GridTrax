import SearchIcon from '@mui/icons-material/Search';
import {
    Alert,
    Box,
    CircularProgress,
    Container,
    Grid,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMulti } from '../api/tmdb';
import MediaCard from '../components/MediaCard';
import type { TMDBSearchResult } from '../types';

let debounceTimer: ReturnType<typeof setTimeout>;

const SearchPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<TMDBSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const primary = theme.palette.primary.main;

    const doSearch = useCallback((q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        setError(null);
        searchMulti(q)
            .then(setResults)
            .catch(() => setError('搜索失败，请检查网络连接或刷新重试。'))
            .finally(() => setLoading(false));
    }, []);

    const handleQueryChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setQuery(val);
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => doSearch(val), 400);
        },
        [doSearch]
    );

    const handleCardClick = useCallback(
        (item: TMDBSearchResult) => {
            if (item.media_type === 'tv') {
                navigate(`/tv/${item.id}`);
            } else {
                navigate(`/movie/${item.id}`);
            }
        },
        [navigate]
    );

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: `linear-gradient(135deg, ${alpha(primary, 0.08)} 0%, transparent 50%)`,
            }}
        >
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Typography
                        variant="h3"
                        fontWeight={800}
                        sx={{
                            background: `linear-gradient(135deg, ${primary}, #CCC2DC)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1,
                        }}
                    >
                        🎬 GridTrax
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        影视追踪 · 点格子 · Material You
                    </Typography>
                </Box>

                {/* Search Bar */}
                <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                    <TextField
                        inputRef={inputRef}
                        fullWidth
                        variant="outlined"
                        placeholder="搜索影视作品…"
                        value={query}
                        onChange={handleQueryChange}
                        autoFocus
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {loading ? (
                                        <CircularProgress size={20} sx={{ color: primary }} />
                                    ) : (
                                        <SearchIcon sx={{ color: primary }} />
                                    )}
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: '28px',
                                backgroundColor: alpha(primary, 0.06),
                                '& fieldset': { borderColor: alpha(primary, 0.3) },
                                '&:hover fieldset': { borderColor: alpha(primary, 0.6) },
                                '&.Mui-focused fieldset': { borderColor: primary },
                            },
                        }}
                    />
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {/* Empty state */}
                {!loading && results.length === 0 && query && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" color="text.secondary">
                            没有找到「{query}」相关的影视作品
                        </Typography>
                    </Box>
                )}

                {/* Landing state */}
                {!query && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h1" sx={{ fontSize: '80px', mb: 2 }}>🎞️</Typography>
                        <Typography variant="h6" color="text.secondary">
                            搜索你喜欢的剧集或电影，开始追踪进度
                        </Typography>
                    </Box>
                )}

                {/* Results Grid */}
                {results.length > 0 && (
                    <Grid container spacing={2}>
                        {results.map((item) => (
                            <Grid key={`${item.media_type}-${item.id}`} sx={{ width: { xs: '50%', sm: '33.33%', md: '25%', lg: '16.66%' } }}>
                                <MediaCard item={item} onClick={handleCardClick} />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
        </Box>
    );
};

export default SearchPage;
