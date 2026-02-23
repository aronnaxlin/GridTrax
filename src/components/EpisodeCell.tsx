import { Box, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { useCallback, useRef, useState } from 'react';
import type { TMDBEpisode } from '../types';

interface EpisodeCellProps {
    episode: TMDBEpisode;
    watched: boolean;
    onSingleClick: (episodeNumber: number) => void;
    onWatchUpTo: (episodeNumber: number) => void;
    onCommentRequest: (episode: TMDBEpisode) => void;
}

const LONG_PRESS_DURATION = 500;

const EpisodeCell: React.FC<EpisodeCellProps> = ({
    episode,
    watched,
    onSingleClick,
    onWatchUpTo,
    onCommentRequest,
}) => {
    const theme = useTheme();
    const [pressed, setPressed] = useState(false);
    const [ripple, setRipple] = useState(false);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const didLongPress = useRef(false);

    const triggerRipple = useCallback(() => {
        setRipple(true);
        setTimeout(() => setRipple(false), 350);
    }, []);

    const handlePressStart = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            // Prevent context menu default on right-click
            if ('button' in e && e.button === 2) return;
            didLongPress.current = false;
            setPressed(true);
            longPressTimer.current = setTimeout(() => {
                didLongPress.current = true;
                setPressed(false);
                triggerRipple();
                onWatchUpTo(episode.episode_number);
            }, LONG_PRESS_DURATION);
        },
        [episode.episode_number, onWatchUpTo, triggerRipple]
    );

    const handlePressEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        setPressed(false);
        if (!didLongPress.current) {
            triggerRipple();
            onSingleClick(episode.episode_number);
        }
    }, [episode.episode_number, onSingleClick, triggerRipple]);

    const handleContextMenu = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            triggerRipple();
            onWatchUpTo(episode.episode_number);
        },
        [episode.episode_number, onWatchUpTo, triggerRipple]
    );

    const handleDoubleClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            onCommentRequest(episode);
        },
        [episode, onCommentRequest]
    );

    const cellSize = 36;
    const primary = theme.palette.primary.main;

    return (
        <Tooltip
            title={
                <Box>
                    <Typography variant="caption" fontWeight={600}>
                        第 {episode.episode_number} 集
                    </Typography>
                    {episode.name && episode.name !== `第 ${episode.episode_number} 集` && (
                        <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                            {episode.name}
                        </Typography>
                    )}
                    <Typography variant="caption" display="block" sx={{ opacity: 0.6, mt: 0.3 }}>
                        长按/右键 → 看到这里 · 双击 → 吐槽
                    </Typography>
                </Box>
            }
            placement="top"
            arrow
        >
            <Box
                component="button"
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={() => {
                    if (longPressTimer.current) {
                        clearTimeout(longPressTimer.current);
                        longPressTimer.current = null;
                    }
                    setPressed(false);
                }}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                onContextMenu={handleContextMenu}
                onDoubleClick={handleDoubleClick}
                sx={{
                    position: 'relative',
                    width: cellSize,
                    height: cellSize,
                    minWidth: cellSize,
                    border: 'none',
                    outline: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'transform 120ms ease, background-color 180ms ease, box-shadow 180ms ease',
                    background: watched
                        ? primary
                        : alpha(primary, 0.12),
                    boxShadow: watched
                        ? `0 0 0 2px ${alpha(primary, 0.5)}`
                        : `inset 0 0 0 2px ${alpha(primary, 0.3)}`,
                    transform: pressed ? 'scale(0.82)' : ripple ? 'scale(0.92)' : 'scale(1)',
                    '&:hover': {
                        background: watched ? alpha(primary, 0.85) : alpha(primary, 0.22),
                        boxShadow: `0 0 0 2px ${alpha(primary, 0.7)}`,
                    },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // Ripple overlay
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '8px',
                        background: alpha('#fff', ripple ? 0.25 : 0),
                        transition: 'background 350ms ease',
                    },
                    // Touch target ensure >= 48dp on mobile
                    '@media (pointer: coarse)': {
                        width: 44,
                        height: 44,
                    },
                }}
                aria-label={`第 ${episode.episode_number} 集${watched ? '（已看）' : ''}`}
                aria-pressed={watched}
            >
                <Typography
                    variant="caption"
                    sx={{
                        color: watched ? '#000' : alpha(primary, 0.9),
                        fontWeight: 700,
                        fontSize: '10px',
                        lineHeight: 1,
                        userSelect: 'none',
                    }}
                >
                    {episode.episode_number}
                </Typography>
            </Box>
        </Tooltip>
    );
};

export default EpisodeCell;
