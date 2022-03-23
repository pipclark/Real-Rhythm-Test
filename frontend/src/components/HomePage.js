import React, { Component } from "react";
import { render } from "react-dom";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
 } from "react-router-dom";
 import { Grid, Button, ButtonGroup, Typography } from '@mui/material'
 import UploadPage from './UploadPage';
 import SessionPage from './SessionPage';
 import ResultsPage from "./ResultsPage";
 import ReturnToSessionPage from './ReturnToSessionPage';
 import ResponsiveNavBar from "./navbar";

export default class HomePage extends React.Component {

    renderHomePage() {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12} align="center">
                    <Typography variant="h3" compact="h3">
                        Real Rhythm Test
                    </Typography>
                    <Typography variant="h5" compact="h5">
                        Analyse your Rhythm playing Real Music
                    </Typography>
                </Grid>
                <Grid item xs={12} align="center">
                    <ButtonGroup disableElevation variant="contained" color="primary">
                        <Button color="primary" to="/return-to-session" component={Link}>
                            Return to Old Analysis Session
                        </Button>
                        <Button color="secondary" to="/upload" component={Link}>
                            Upload a new music file
                        </Button>
                    </ButtonGroup>
                </Grid>
            </Grid>
        );
    }

    render() {
        return (
        <Router>
            <div className="navBar">
            <ResponsiveNavBar />
            </div>
            <div className="center">
            <Routes>
                
                <Route path="/" element={this.renderHomePage()}></Route>

                <Route path="/upload" element={<UploadPage />} />
                <Route path="/session/:sessionCode" element={<SessionPage />} />
                <Route path="/results/:sessionCode" element={<ResultsPage />} />
                <Route path="/return-to-session" element={<ReturnToSessionPage />} />
            </Routes>
            </div>
        </Router>
        );
    }
}