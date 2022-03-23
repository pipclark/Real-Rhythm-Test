import React, { Component, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Grid, Button, Typography, FormControl, FormHelperText, 
    FormControlLabel, RadioGroup, Radio, TextField, Box, Slider, Popover } from '@mui/material';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import ScatterChart from './ScatterChart';
import HistogramChart from './Histogram';

export default function ResultsPage(props) {
    const navigate = useNavigate();

        // get the transfered data
    const location = useLocation()
    const beatNos = JSON.parse(location.state.beatNos);
    const noteDelays = JSON.parse(location.state.noteDelays);
    const gaussianFit = location.state.gaussianFit;
    const analysisSummary = location.state.analysisSummary;
    const username = location.state.username;
    const title = location.state.title;
    const tempo = location.state.tempo;
    const sessionCode = location.state.sessionCode;

    const averager = location.state.averager;
    const sampleRate = location.state.sampleRate * averager; // this is for if it gets passed back to session where it will be divided again
    const waveDataJSON = location.state.waveDataJSON;
    
    // add detected tempo, smallest division, p1, p2
    
    // scrolling between graphs
    const [activeGraph, setActiveGraph] = useState(0)
    const [numberOfGraphs, setNumberOfGraphs] = useState(3)
    
    const scrollBackward = () => {
        if(activeGraph > 0) {
            setActiveGraph(activeGraph -1)
        }
    }

    const scrollForward = () => {
        if(activeGraph < numberOfGraphs -1) {
            setActiveGraph(activeGraph+1)
        }
    }

    const returnToNoteDetectionButtonPressed = () => {
        navigate('/session/' + sessionCode,
        {state : {
            sampleRate: sampleRate, 
            waveData: waveDataJSON,
            averager: averager,
            username: username,
            title: title,
            tempo: tempo,
            sessionCode: sessionCode,
        }}); 
    }
    
    // scatter graph data
    const [scatterData, setScatterData] = useState([]);

    useEffect(() => {
        generateScatterData();
    }, []);

    function generateScatterData() {
        const chartData = [];
        for (let i = 0; i < beatNos.length; i++) {
        chartData.push({
            label: beatNos[i],
            value: noteDelays[i],
            tooltipContent: `<b>x: </b>${beatNos[i]}<br><b>y: </b>${noteDelays[i]}`
        });
        }
        setScatterData(chartData)
    }

    // Histogram data
    const [sizeOfBins, setSizeOfBins] = useState(0.01)
    const [numberOfBins, setNumberOfBins] = useState(10)

    function calculateNumberOfBins() {
        const min = Math.min.apply(null, noteDelays);
        const max =  Math.max.apply(null, noteDelays);
        const number = Math.ceil((max-min)/sizeOfBins) // round up
        setNumberOfBins(number);
    }

    const handleBinSizeChange = (e, newValue) => {
        setSizeOfBins(newValue);
        calculateNumberOfBins();
    }


    // centre part with graph / words that will change with arrays
    function renderResultsDisplay() {
        if(activeGraph == 2) {
            return (
                <Grid item xs={12}>
                    <Typography variant="h5" compact="h5">
                    Timing of all notes compared to perfectly the beat
                </Typography>
                <ScatterChart data={scatterData} width={600} height={300} />
                </Grid>
            );
        }
        else if (activeGraph == 1) {
            function binSizeValueLabelFormat(value) {
                var msValue = value*1000
                return `${msValue} ms`;
            }
            return (
                <><Grid item xs={12}>
                    <HistogramChart data={noteDelays} curve={gaussianFit} nBin={numberOfBins} width={600} height={300} />

                        <Typography gutterBottom>
                            Bin Size
                        </Typography>
                        <Box width={300}>
                        <Slider
                            aria-label="Bin Size"
                            value={sizeOfBins}
                            onChange={handleBinSizeChange}
                            step={0.002}
                            //marks
                            min={0.002}
                            max={0.02}
                            valueLabelFormat={binSizeValueLabelFormat}
                            valueLabelDisplay="auto" />
                        </Box>
                </Grid></>
            );
        }
        else if (activeGraph == 0) {
            return (
                <Grid item xs={12}>
                    <Typography>
                    The {analysisSummary.analysis_type} Tempo was {Math.round(analysisSummary.tempo *10)/10} bpm, with the smallest subdivisions as 1/{analysisSummary.smallest_division} notes.
                    Notes were on average {analysisSummary.avg_timing} by {Math.round(analysisSummary.mean * 1000)} ms, which could give the music a {analysisSummary.avg_feel} feel.
                    The standard deviation from the average was {Math.round(analysisSummary.std_dev *1000)} ms, with maximum deviations of + {Math.round(Math.max.apply(null, noteDelays)*1000)} ms
                    and {Math.round(Math.min.apply(null, noteDelays)*1000)} ms from the beat.
                    Since the average person can only detect timing differences greater than 30 ms, most of your playing will {analysisSummary.avg_rhythm}.

                    </Typography>
                </Grid>
            );
        }
        else { 
            console.log(`error activeGraph number = ${activeGraph} which is not available`);
        }
    }

    return (
        <Grid container spacing={3} align="center">
            <Grid item xs={12}>
                <Typography variant="h4" compact="h4">
                    {title} Rhythm Analysis.
                </Typography>
            </Grid>

            
            
            {renderResultsDisplay()}
            
            

            <Grid item xs={6}>
                <Button variant='outlined' onClick={scrollBackward}>
                    <ArrowBackIosIcon fontSize="large" color="primary" ></ArrowBackIosIcon>
                </Button>
            </Grid>
            <Grid item xs={6}>
                <Button variant='outlined' onClick={scrollForward}>
                    <ArrowForwardIosIcon fontSize="large" color="primary" ></ArrowForwardIosIcon>
                </Button>
            </Grid>
            <Grid item xs={12}>
                <Button variant='outlined' color="secondary" onClick={returnToNoteDetectionButtonPressed}>
                    Return to Note Detection
                </Button>
            </Grid>

        </Grid>
    )
}