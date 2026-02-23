import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    Snackbar,
    TextField,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { useCallback, useState } from 'react';
import { useProgressStore } from '../store/useProgressStore';
import type { TMDBEpisode } from '../types';
import EpisodeCell from './EpisodeCell';

interface EpisodeGridProps {
    tvId: number;
    seasonNumber: number;
    episodes: TMDBEpisode[];
}

const EpisodeGrid: React.FC<EpisodeGridProps> = ({ tvId, seasonNumber, episodes }) => {
    const theme = useTheme();
    const {
        toggleEpisodeWatched,
        watchUpToEpisode,
        setEpisodeComment,
        getEpisodeRecord,
        ensureSeasonRecord,
    } = useProgressStore();

    const [snackbar, setSnackbar] = useState<string | null>(null);
    const [commentDialog, setCommentDialog] = useState<{ episode: TMDBEpisode; text: string } | null>(null);

    // Ensure record exists
    React.useEffect(() => {
        ensureSeasonRecord(tvId, seasonNumber);
    }, [tvId, seasonNumber, ensureSeasonRecord]);

    const handleSingleClick = useCallback(
        (episodeNumber: number) => {
            toggleEpisodeWatched(tvId, seasonNumber, episodeNumber);
        },
        [tvId, seasonNumber, toggleEpisodeWatched]
    );

    const handleWatchUpTo = useCallback(
        (episodeNumber: number) => {
            watchUpToEpisode(tvId, seasonNumber, episodeNumber, episodes.length);
            setSnackbar(`已标记第 1 ~ ${episodeNumber} 集为已看 ✓`);
        },
        [tvId, seasonNumber, episodes.length, watchUpToEpisode]
    );

    const handleCommentRequest = useCallback((episode: TMDBEpisode) => {
        const existing = getEpisodeRecord(tvId, seasonNumber, episode.episode_number);
        setCommentDialog({ episode, text: existing.comment });
    }, [tvId, seasonNumber, getEpisodeRecord]);

    const handleCommentSave = useCallback(() => {
        if (!commentDialog) return;
        setEpisodeComment(tvId, seasonNumber, commentDialog.episode.episode_number, commentDialog.text);
        setCommentDialog(null);
    }, [commentDialog, tvId, seasonNumber, setEpisodeComment]);

    const watchedCount = episodes.filter(
        (ep) => getEpisodeRecord(tvId, seasonNumber, ep.episode_number).watched
    ).length;
    const progress = episodes.length > 0 ? (watchedCount / episodes.length) * 100 : 0;

    const primary = theme.palette.primary.main;

    return (
        <Box>
            {/* Progress bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(primary, 0.15),
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: primary,
                        },
                    }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 60, textAlign: 'right' }}>
                    {watchedCount} / {episodes.length}
                </Typography>
            </Box>

            {/* Grid of cells */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    // Ensure at least 48dp on mobile by setting touch area
                }}
            >
                {episodes.map((episode) => {
                    const rec = getEpisodeRecord(tvId, seasonNumber, episode.episode_number);
                    return (
                        <EpisodeCell
                            key={episode.episode_number}
                            episode={episode}
                            watched={rec.watched}
                            onSingleClick={handleSingleClick}
                            onWatchUpTo={handleWatchUpTo}
                            onCommentRequest={handleCommentRequest}
                        />
                    );
                })}
            </Box>

            {/* Snackbar for bulk watch */}
            <Snackbar
                open={!!snackbar}
                autoHideDuration={2500}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(null)}
                    severity="success"
                    variant="filled"
                    sx={{ borderRadius: 4 }}
                >
                    {snackbar}
                </Alert>
            </Snackbar>

            {/* Comment Dialog */}
            <Dialog
                open={!!commentDialog}
                onClose={() => setCommentDialog(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, backgroundColor: 'background.paper' } }}
            >
                <DialogTitle>
                    第 {commentDialog?.episode.episode_number} 集吐槽
                    {commentDialog?.episode.name && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {commentDialog.episode.name}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        multiline
                        minRows={3}
                        maxRows={8}
                        fullWidth
                        placeholder="写下你对这集的想法…"
                        value={commentDialog?.text ?? ''}
                        onChange={(e) =>
                            setCommentDialog((prev) => (prev ? { ...prev, text: e.target.value } : null))
                        }
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setCommentDialog(null)} color="inherit">
                        取消
                    </Button>
                    <Button onClick={handleCommentSave} variant="contained" sx={{ borderRadius: 4 }}>
                        保存吐槽
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EpisodeGrid;
