import { lightBlue, orange } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
      primary: {
        main: lightBlue[500],
      },
      secondary: {
        main: orange[500],
      }
    }
  });

  export default theme;