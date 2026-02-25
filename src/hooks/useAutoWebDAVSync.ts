/**
 * useAutoWebDAVSync
 *
 * - On mount (page load): bidirectional merge with remote WebDAV data
 * - On visibilitychange → hidden (tab switch/close): upload current data
 *
 * Only runs when WebDAV is configured (url + username + password non-empty).
 */

import { useEffect, useRef } from 'react';
import { mergeProgressData, webdavDownload, webdavUpload } from '../api/webdavService';
import { useProgressStore } from '../store/useProgressStore';
import { useWebDAVStore } from '../store/useWebDAVStore';

export function useAutoWebDAVSync() {
    const { config, isConfigured } = useWebDAVStore();
    const isSyncingRef = useRef(false);

    // ── Load: bidirectional merge when configured ───────────────────────────
    useEffect(() => {
        if (!isConfigured()) return;

        const runSync = async () => {
            if (isSyncingRef.current) return;
            isSyncingRef.current = true;
            try {
                const remoteData = await webdavDownload(config);
                if (remoteData) {
                    const localData = useProgressStore.getState().data;
                    const merged = mergeProgressData(localData, remoteData);
                    useProgressStore.setState((s) => ({ ...s, data: merged }));
                }
            } catch {
                // Silently fail — don't disrupt the user experience
            } finally {
                isSyncingRef.current = false;
            }
        };

        void runSync();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount only

    // ── Close/hide: upload to WebDAV when tab loses visibility ─────────────
    useEffect(() => {
        if (!isConfigured()) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'hidden') return;

            const data = useProgressStore.getState().data;
            const uploadData = { ...data, last_sync: Date.now() };

            // Use keepalive fetch so the request survives tab close.
            // webdavUpload internally uses fetch without keepalive, so we
            // call it in the synchronous handler. Most browsers will complete
            // in-flight fetch requests for a short window after the page hides.
            void webdavUpload(config, uploadData).catch(() => {
                // Silently fail
            });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.url, config.username, config.password, config.filePath]);
}
