import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f4c81',
      light: '#4f78a0',
      dark: '#0b355a',
    },
    secondary: {
      main: '#00796b',
      light: '#4db6ac',
      dark: '#004d40',
    },
    background: {
      default: '#eef3f7',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Nunito Sans", "Segoe UI", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 10px 24px rgba(23, 40, 65, 0.10)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #0f4c81 0%, #1a659e 58%, #2288b9 100%)',
        },
      },
    },
  },
})
