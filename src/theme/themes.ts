export interface BaseThemeConfig {
    id: string;
    name: string;
    primary: { main: string; light: string; dark: string; contrastText: string };
    secondary: { main: string; light: string; dark: string; contrastText: string };
    background: { default: string; paper: string };
    text: { primary: string; secondary: string };
}

export const PREDEFINED_THEMES: BaseThemeConfig[] = [
    {
        id: 'ocean',
        name: 'Ocean Blue',
        primary: { main: '#02a3fb', light: '#5ecbff', dark: '#0070bb', contrastText: '#ffffff' },
        secondary: { main: '#8fd3fb', light: '#c3e8fd', dark: '#4aa0ca', contrastText: '#003350' },
        background: { default: '#0a1014', paper: '#111a22' },
        text: { primary: '#e1eff8', secondary: '#92abbd' },
    },
    {
        id: 'dracula',
        name: 'Dracula',
        primary: { main: '#bd93f9', light: '#d6bcfb', dark: '#895df0', contrastText: '#282a36' },
        secondary: { main: '#ff79c6', light: '#ff9ce1', dark: '#da59b9', contrastText: '#282a36' },
        background: { default: '#282a36', paper: '#313444' },
        text: { primary: '#f8f8f2', secondary: '#6272a4' },
    },
    {
        id: 'nord',
        name: 'Nord Frost',
        primary: { main: '#88c0d0', light: '#8fbcbb', dark: '#5e81ac', contrastText: '#2e3440' },
        secondary: { main: '#81a1c1', light: '#98b7d6', dark: '#4c566a', contrastText: '#2e3440' },
        background: { default: '#2e3440', paper: '#3b4252' },
        text: { primary: '#d8dee9', secondary: '#e5e9f0' },
    },
    {
        id: 'tokyonight',
        name: 'Tokyo Night',
        primary: { main: '#7aa2f7', light: '#89b4fa', dark: '#3d59a1', contrastText: '#1a1b26' },
        secondary: { main: '#bb9af7', light: '#c0caf5', dark: '#7dcfff', contrastText: '#1a1b26' },
        background: { default: '#1a1b26', paper: '#1f2335' },
        text: { primary: '#c0caf5', secondary: '#565f89' },
    },
    {
        id: 'gruvbox',
        name: 'Gruvbox',
        primary: { main: '#fe8019', light: '#fabd2f', dark: '#d65d0e', contrastText: '#282828' },
        secondary: { main: '#8ec07c', light: '#b8bb26', dark: '#689d6a', contrastText: '#282828' },
        background: { default: '#282828', paper: '#32302f' },
        text: { primary: '#ebdbb2', secondary: '#a89984' },
    },
];

export const getThemeConfig = (id: string): BaseThemeConfig => {
    return PREDEFINED_THEMES.find((t) => t.id === id) || PREDEFINED_THEMES[0];
};
