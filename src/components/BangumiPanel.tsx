import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SaveIcon from '@mui/icons-material/Save';
import SyncIcon from '@mui/icons-material/Sync';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import React, { useState } from 'react';
import {
    BANGUMI_TO_GRIDTRAX,
    GRIDTRAX_TO_BANGUMI,
    bangumiGetCollections,
    bangumiGetMe,
    bangumiPatchCollection,
    type BangumiCollectionType
} from '../api/bangumiService';
import { searchTV } from '../api/tmdb';
import { useBangumiStore } from '../store/useBangumiStore';
import { useProgressStore } from '../store/useProgressStore';
import type { SeasonRecord } from '../types';

type Status = 'idle' | 'loading' | 'success' | 'error';
interface StatusResult { type: Status; message: string }
const idle: StatusResult = { type: 'idle', message: '' };

// ── Conflict resolution dialog ────────────────────────────────────────────────

interface ConflictItem {
    key: string;
    localStatus: string;
    remoteStatus: string;
}

const ConflictDialog: React.FC<{
    conflicts: ConflictItem[];
    open: boolean;
    onResolve: (preference: 'local' | 'remote') => void;
}> = ({ conflicts, open, onResolve }) => (
    <Dialog open={open} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>同步冲突</DialogTitle>
        <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                以下 {conflicts.length} 个条目在 GridTrax 和 Bangumi 之间状态不同，请选择以哪一方为准：
            </Typography>
            <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                {conflicts.slice(0, 10).map((c) => (
                    <Box key={c.key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" noWrap sx={{ maxWidth: '50%' }}>{c.key}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            本地: {c.localStatus} → Bangumi: {c.remoteStatus}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => onResolve('local')} variant="outlined" sx={{ borderRadius: 2 }}>
                保留 GridTrax 数据
            </Button>
            <Button onClick={() => onResolve('remote')} variant="contained" sx={{ borderRadius: 2 }}>
                以 Bangumi 为准
            </Button>
        </DialogActions>
    </Dialog>
);

// ── Main BangumiPanel ─────────────────────────────────────────────────────────

const BangumiPanel: React.FC = () => {
    const { token, username, nickname, setToken, setUserInfo } = useBangumiStore();
    const progressData = useProgressStore((s) => s.data);

    const [formToken, setFormToken] = useState(token);
    const [showToken, setShowToken] = useState(false);
    const [authStatus, setAuthStatus] = useState<StatusResult>(idle);
    const [syncStatus, setSyncStatus] = useState<StatusResult>(idle);
    const [importProgress, setImportProgress] = useState<{ current: number; total: number; name: string } | null>(null);
    const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
    const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
    const [pendingConflictResolver, setPendingConflictResolver] = useState<null | ((pref: 'local' | 'remote') => void)>(null);

    const isConfigured = !!(token && username);

    // ── Verify token ──────────────────────────────────────────────────────────
    const handleVerify = async () => {
        if (!formToken.trim()) return;
        setAuthStatus({ type: 'loading', message: '正在验证 Token…' });
        try {
            const me = await bangumiGetMe(formToken.trim());
            setToken(formToken.trim());
            setUserInfo({ username: me.username, userId: me.id, nickname: me.nickname });
            setAuthStatus({ type: 'success', message: `已登录为 ${me.nickname} (@${me.username})` });
        } catch (e) {
            setAuthStatus({ type: 'error', message: (e as Error).message });
        }
    };

    // ── Import from Bangumi ───────────────────────────────────────────────────
    const handleImport = async () => {
        if (!isConfigured) return;
        setSyncStatus({ type: 'loading', message: '正在从 Bangumi 拉取收藏列表…' });
        setImportProgress(null);
        try {
            // 1. Pull all collections from Bangumi (anime = subject_type 2)
            const collections = await bangumiGetCollections(token, username, 2);
            const total = collections.length;
            const store = useProgressStore.getState();
            let imported = 0;
            let skipped = 0;

            // 2. For every Bangumi collection, search TMDB and create/update a GridTrax record
            for (let i = 0; i < collections.length; i++) {
                const col = collections[i];
                const nameForSearch = col.subject?.name_cn || col.subject?.name || '';
                const nameOriginal = col.subject?.name || '';
                setImportProgress({ current: i + 1, total, name: nameForSearch || nameOriginal || `#${col.subject_id}` });

                // Check cache first
                const cachedKey = Object.keys(store.data.records).find(
                    (k) => (store.data.records[k] as SeasonRecord).bangumi_subject_id === col.subject_id
                );

                if (cachedKey) {
                    // Already matched before — just update status/rating
                    const rec = store.data.records[cachedKey] as SeasonRecord;
                    store.setSeasonStatus(rec.tmdb_id, rec.season_number, BANGUMI_TO_GRIDTRAX[col.type]);
                    if (col.rate > 0) store.setSeasonRating(rec.tmdb_id, rec.season_number, col.rate);
                    imported++;
                    continue;
                }

                // Try to find TMDB match: search by Chinese name, then by Japanese original name
                let tmdbMatch: { id: number; name: string; poster_path?: string } | null = null;
                for (const query of [nameForSearch, nameOriginal].filter(Boolean)) {
                    tmdbMatch = await searchTV(query);
                    if (tmdbMatch) break;
                }

                if (!tmdbMatch) {
                    // TMDB has no match → skip per project rules
                    skipped++;
                    continue;
                }

                // Create/update a season 1 record by default (Bangumi treats each series as one entry)
                const tmdbId = tmdbMatch.id;
                const seasonNumber = 1;
                const gridtraxStatus = BANGUMI_TO_GRIDTRAX[col.type];

                store.setSeasonStatus(tmdbId, seasonNumber, gridtraxStatus, {
                    show_name: tmdbMatch.name,
                    name: `第 1 季`,
                    poster_path: tmdbMatch.poster_path,
                });
                if (col.rate > 0) store.setSeasonRating(tmdbId, seasonNumber, col.rate);

                // Cache the bangumi_subject_id in this record
                const recKey = `tmdb_tv_${tmdbId}_s${seasonNumber}`;
                useProgressStore.setState((s) => ({
                    data: {
                        ...s.data,
                        records: {
                            ...s.data.records,
                            [recKey]: {
                                ...s.data.records[recKey],
                                bangumi_subject_id: col.subject_id,
                            } as SeasonRecord,
                        },
                    },
                }));
                imported++;

                // Small delay to avoid hammering TMDB API
                await new Promise((r) => setTimeout(r, 250));
            }

            setImportProgress(null);
            setSyncStatus({ type: 'success', message: `导入完成！匹配 ${imported} 条，跳过 ${skipped} 条（TMDB 无对应条目）。` });
        } catch (e) {
            setImportProgress(null);
            setSyncStatus({ type: 'error', message: (e as Error).message });
        }
    };

    // ── Incremental sync (GridTrax ←→ Bangumi) ────────────────────────────────
    const handleIncrementalSync = async () => {
        if (!isConfigured) return;
        setSyncStatus({ type: 'loading', message: '正在拉取 Bangumi 收藏…' });
        try {
            const collections = await bangumiGetCollections(token, username, 2);
            const bgmMap = new Map(collections.map((c) => [c.subject_id, c]));
            const store = useProgressStore.getState();
            const detectedConflicts: ConflictItem[] = [];

            for (const [key, rec] of Object.entries(progressData.records)) {
                if (rec.type !== 'tv_season') continue;
                const sr = rec as SeasonRecord;
                if (!sr.bangumi_subject_id) continue;
                const bgm = bgmMap.get(sr.bangumi_subject_id);
                if (!bgm) continue;

                const bgmStatus = BANGUMI_TO_GRIDTRAX[bgm.type];
                if (sr.global_status && bgmStatus && sr.global_status !== bgmStatus) {
                    detectedConflicts.push({
                        key: sr.show_name || key,
                        localStatus: sr.global_status,
                        remoteStatus: bgmStatus,
                    });
                }
            }

            if (detectedConflicts.length > 0) {
                setConflicts(detectedConflicts);
                setSyncStatus({ type: 'idle', message: '' });
                // Wait for user decision
                const preference = await new Promise<'local' | 'remote'>((resolve) => {
                    setPendingConflictResolver(() => resolve);
                    setConflictDialogOpen(true);
                });

                setConflictDialogOpen(false);
                setPendingConflictResolver(null);

                // Apply conflict resolution
                for (const [_key, rec] of Object.entries(progressData.records)) {
                    if (rec.type !== 'tv_season') continue;
                    const sr = rec as SeasonRecord;
                    if (!sr.bangumi_subject_id) continue;
                    const bgm = bgmMap.get(sr.bangumi_subject_id);
                    if (!bgm) continue;

                    if (preference === 'remote') {
                        store.setSeasonStatus(sr.tmdb_id, sr.season_number, BANGUMI_TO_GRIDTRAX[bgm.type]);
                        if (bgm.rate > 0) store.setSeasonRating(sr.tmdb_id, sr.season_number, bgm.rate);
                    } else {
                        // Push local to Bangumi
                        if (sr.global_status) {
                            await bangumiPatchCollection(token, sr.bangumi_subject_id, {
                                type: GRIDTRAX_TO_BANGUMI[sr.global_status],
                                rate: sr.rating,
                            });
                        }
                    }
                }
            } else {
                // No conflicts — push all local data to Bangumi
                setSyncStatus({ type: 'loading', message: '推送本地进度到 Bangumi…' });
                for (const rec of Object.values(progressData.records)) {
                    if (rec.type !== 'tv_season') continue;
                    const sr = rec as SeasonRecord;
                    if (!sr.bangumi_subject_id || !sr.global_status) continue;
                    await bangumiPatchCollection(token, sr.bangumi_subject_id, {
                        type: GRIDTRAX_TO_BANGUMI[sr.global_status],
                        rate: sr.rating,
                    });
                }
            }

            setSyncStatus({ type: 'success', message: '增量同步完成！' });
        } catch (e) {
            setSyncStatus({ type: 'error', message: (e as Error).message });
        }
    };

    // ── Push single record to Bangumi (used by auto-push) ─────────────────────
    // (Not triggered here directly, but exported)

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                    BANGUMI 同步
                </Typography>
                {isConfigured && (
                    <Chip
                        icon={<AccountCircleIcon sx={{ fontSize: '14px !important' }} />}
                        label={nickname || username}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ ml: 'auto', fontSize: '0.7rem' }}
                    />
                )}
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1.5 }}>
                将 GridTrax 进度与您的 bgm.tv 账号双向同步（仅同步 TMDB 能匹配到的动漫条目）
            </Typography>

            {/* Token Input */}
            <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                    label="Bangumi Access Token"
                    placeholder="在 next.bgm.tv/demo/access-token 获取"
                    value={formToken}
                    onChange={(e) => setFormToken(e.target.value)}
                    size="small"
                    type={showToken ? 'text' : 'password'}
                    fullWidth
                    slotProps={{
                        inputLabel: { shrink: true },
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Button
                                        size="small"
                                        onClick={() => setShowToken((v) => !v)}
                                        sx={{ minWidth: 0, px: 1, fontSize: '0.7rem', color: 'text.secondary' }}
                                    >
                                        {showToken ? '隐藏' : '显示'}
                                    </Button>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Tooltip title="验证并保存 Token" placement="top" arrow>
                    <IconButton
                        color="primary"
                        onClick={handleVerify}
                        disabled={!formToken.trim()}
                        sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            height: 40,
                            width: 40,
                            '&:hover': { borderColor: 'primary.main', backgroundColor: (t) => alpha(t.palette.primary.main, 0.08) },
                        }}
                    >
                        <SaveIcon />
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Auth Status */}
            <Collapse in={authStatus.type !== 'idle'} unmountOnExit>
                <Box sx={{ mt: 1 }}>
                    {authStatus.type === 'loading' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={14} />
                            <Typography variant="caption" color="text.secondary">{authStatus.message}</Typography>
                        </Box>
                    )}
                    {authStatus.type === 'success' && (
                        <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />} sx={{ py: 0.5, borderRadius: 2 }}>
                            {authStatus.message}
                        </Alert>
                    )}
                    {authStatus.type === 'error' && (
                        <Alert severity="error" icon={<ErrorIcon fontSize="inherit" />} sx={{ py: 0.5, borderRadius: 2 }}>
                            {authStatus.message}
                        </Alert>
                    )}
                </Box>
            </Collapse>

            {/* Action Buttons */}
            {isConfigured && (
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, alignItems: 'center' }}>
                    <Tooltip title="首次导入：将 Bangumi 收藏状态导入 GridTrax" arrow>
                        <span style={{ flex: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={syncStatus.type === 'loading' ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon />}
                                onClick={handleImport}
                                disabled={syncStatus.type === 'loading'}
                                fullWidth
                                sx={{ borderRadius: 2 }}
                            >
                                从 Bangumi 导入
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="增量同步：处理冲突后双向同步" arrow>
                        <span style={{ flex: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={syncStatus.type === 'loading' ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
                                onClick={handleIncrementalSync}
                                disabled={syncStatus.type === 'loading'}
                                fullWidth
                                sx={{ borderRadius: 2, fontWeight: 700 }}
                            >
                                增量同步
                            </Button>
                        </span>
                    </Tooltip>
                </Box>
            )}

            {/* Get token link */}
            {!isConfigured && (
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                    前往&nbsp;
                    <a href="https://next.bgm.tv/demo/access-token" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                        next.bgm.tv/demo/access-token
                    </a>
                    &nbsp;生成 Access Token
                </Typography>
            )}

            {/* Sync Status */}
            <Collapse in={syncStatus.type !== 'idle'} unmountOnExit>
                <Box sx={{ mt: 1.5 }}>
                    {syncStatus.type === 'loading' && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={14} />
                                <Typography variant="caption" color="text.secondary">{syncStatus.message}</Typography>
                            </Box>
                            {importProgress && (
                                <Box sx={{ mt: 0.5, pl: 0.5 }}>
                                    <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block' }}>
                                        正在匹配：{importProgress.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <Box sx={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: 'divider', overflow: 'hidden' }}>
                                            <Box
                                                sx={{
                                                    height: '100%',
                                                    borderRadius: 2,
                                                    backgroundColor: 'primary.main',
                                                    width: `${(importProgress.current / importProgress.total) * 100}%`,
                                                    transition: 'width 0.3s ease',
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap' }}>
                                            {importProgress.current} / {importProgress.total}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                    {syncStatus.type === 'success' && (
                        <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />} sx={{ py: 0.5, borderRadius: 2 }}>
                            {syncStatus.message}
                        </Alert>
                    )}
                    {syncStatus.type === 'error' && (
                        <Alert severity="error" icon={<ErrorIcon fontSize="inherit" />} sx={{ py: 0.5, borderRadius: 2 }}>
                            {syncStatus.message}
                        </Alert>
                    )}
                </Box>
            </Collapse>

            {/* Conflict Dialog */}
            <ConflictDialog
                conflicts={conflicts}
                open={conflictDialogOpen}
                onResolve={(pref) => pendingConflictResolver?.(pref)}
            />
        </Box>
    );
};

export default BangumiPanel;

// ── Auto-push helper (called from useProgressStore) ────────────────────────────

/**
 * Silently push a single season status update to Bangumi if configured.
 * Called after setSeasonStatus / setSeasonRating.
 */
export async function autoPushToBangumi(
    bangumi_subject_id: number | undefined,
    collectionType: BangumiCollectionType | undefined,
    rating: number,
): Promise<void> {
    const { token } = useBangumiStore.getState();
    if (!token || !bangumi_subject_id || !collectionType) return;
    try {
        await bangumiPatchCollection(token, bangumi_subject_id, {
            type: collectionType,
            rate: rating,
        });
    } catch {
        // Silently fail — auto-push is best-effort
    }
}
