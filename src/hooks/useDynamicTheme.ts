import ColorThief from 'colorthief';
import { useCallback, useEffect, useState } from 'react';

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function useDynamicTheme(imageUrl?: string) {
    const [primaryColor, setPrimaryColor] = useState<string | undefined>(undefined);

    const extractColor = useCallback(
        (url: string) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            img.onload = () => {
                try {
                    const colorThief = new ColorThief();
                    const [r, g, b] = colorThief.getColor(img);
                    // Boost saturation slightly for Material You feel
                    setPrimaryColor(rgbToHex(r, g, b));
                } catch {
                    setPrimaryColor(undefined);
                }
            };
            img.onerror = () => setPrimaryColor(undefined);
        },
        []
    );

    useEffect(() => {
        if (imageUrl) {
            extractColor(imageUrl);
        } else {
            setPrimaryColor(undefined);
        }
    }, [imageUrl, extractColor]);

    return primaryColor;
}
