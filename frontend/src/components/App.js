import React, { Component } from "react";
import { render } from "react-dom";
import HomePage from './HomePage';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';


function App() {

    return (
    <ThemeProvider theme={theme}>

    <HomePage />
    
    </ThemeProvider>
    );
    
}

const appDiv = document.getElementById("app");
render(<App />,  appDiv);