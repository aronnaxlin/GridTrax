import { Box, Rating, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React from 'react';
import type { WatchStatus } from '../types';
import { STATUS_LABELS } from '../types';

interface GlobalStatusPickerProps {
    status: WatchStatus;
    rating: number;
    onStatusChange: (status: WatchStatus) => void;
    onRatingChange: (rating: number) => void;
}

const STATUSES: WatchStatus[] = ['Wish', 'Do', 'Collect', 'OnHold', 'Dropped'];

const STATUS_EMOJI: Record<WatchStatus, string> = {
    Wish: '🔖',
    Do: '▶️',
    Collect: '✅',
    OnHold: '⏸️',
    Dropped: '🗑️',
};

const GlobalStatusPicker: React.FC<GlobalStatusPickerProps> = ({
    status,
    rating,
    onStatusChange,
    onRatingChange,
}) => {
    const theme = useTheme();
    const primary = theme.palette.primary.main;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Status Chips */}
            <ToggleButtonGroup
                value={status}
                exclusive
                onChange={(_, val) => val && onStatusChange(val as WatchStatus)}
                size="small"
                sx={{
                    flexWrap: 'wrap',
                    gap: 0.5,
                    '& .MuiToggleButtonGroup-grouped': {
                        border: 'none !important',
                        borderRadius: '20px !important',
                        mx: 0,
                    },
                }}
            >
                {STATUSES.map((s) => (
                    <ToggleButton
                        key={s}
                        value={s}
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '20px !important',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: status === s ? '#000' : 'text.secondary',
                            background: status === s ? primary : alpha(primary, 0.1),
                            '&.Mui-selected': {
                                background: primary,
                                color: '#000',
                                '&:hover': { background: alpha(primary, 0.85) },
                            },
                            '&:hover': {
                                background: alpha(primary, 0.2),
                            },
                            transition: 'all 150ms ease',
                        }}
                    >
                        {STATUS_EMOJI[s]} {STATUS_LABELS[s]}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>

            {/* 10-star Rating */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating
                    max={10}
                    value={rating}
                    onChange={(_, val) => onRatingChange(val ?? 0)}
                    size="small"
                    sx={{
                        '& .MuiRating-iconFilled': { color: primary },
                        '& .MuiRating-iconHover': { color: alpha(primary, 0.7) },
                    }}
                />
                {rating > 0 && (
                    <Typography variant="caption" sx={{ color: primary, fontWeight: 700 }}>
                        {rating}/10
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default GlobalStatusPicker;
