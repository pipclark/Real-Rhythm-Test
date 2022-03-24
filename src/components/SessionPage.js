import React, { Component, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Grid, Button, Typography, FormControl, FormHelperText, 
    FormControlLabel, RadioGroup, Radio, TextField, Box, Slider, Popover } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import IconButton from "@mui/material/IconButton";
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';

import axios from 'axios';
    
import LineChart from './MultipleLineChart';


export default function SessionPage(props) {

    const navigate = useNavigate();

    const location = useLocation()
    // get the transfered data
    const waveDataJSON = location.state.waveData;
    const averager = location.state.averager // number the wave data was averaged by
    const sampleRate = location.state.sampleRate / averager;
    const username = location.state.username;
    const title = location.state.title;
    const tempo = location.state.tempo;
    const sessionCode = location.state.sessionCode
    
    //decode the waveData
    const waveData = JSON.parse(waveDataJSON);
    const maxval = Math.max.apply(null, waveData);
    const minval = Math.min.apply(null, waveData);

    // setting up noteOnsets as array 0 values initially
    const [noteOnsets, setNoteOnsets] = useState(new Array(waveData.length).fill(110))
    const [noteOnsetObject, setNoteOnsetObject] = useState({})
    
    //some maths
    const sampleTimeInterval = 1/(sampleRate);
    const musicTotalLength = waveData.length * sampleTimeInterval
    
    // time range variables
    const [timeWindow, setTimeWindow] = useState(10)
    const [startTime, setStartTime] = useState(0)
    const [endTime, setEndTime] = useState(startTime+timeWindow)
    // variable parameters for note onset detection
    const [threshold, setThreshold] = useState(maxval/10)
    const [indexBehind1, setIndexBehind1] = useState(5)
    const [indexBehind2, setIndexBehind2] = useState(25)

    // other things used on page
    const [calculatingNoteOnsets, setCalculatingNoteOnsets] = useState(false);
    const [analysingRhythm, setAnalysingRhythm] = useState(false)
    const [error, setError] = useState("")
    
    const handleTimeRangeChange = (e, newValue) => {
        setStartTime(newValue);
        setEndTime(newValue+timeWindow);
        regenerateData();
        regenerateNoteOnsets();
    }
    const handleTimeWindowChange = (e, newValue) => {
        setTimeWindow(newValue);
        setEndTime(newValue+startTime);
        regenerateData();
        regenerateNoteOnsets();
    }

    const handleThresholdChange = (e, newValue) => {
        setThreshold(newValue);
        
    }


    const calculateNoteOnsets = () => {
        setCalculatingNoteOnsets(true);
        let calculationData = new FormData();
        calculationData.append('threshold', threshold);
        calculationData.append('session_code', sessionCode);
        axios.post('/api/note-onsets', calculationData, {
            headers: {
                'content-type': 'multipart/form-data'
            }
        })
            .then((response) => {
                if(response.status==200){
                //console.log(response.data);
                setError("");
                setNoteOnsets(JSON.parse(response.data.note_onset_data));
                setNoteOnsetObject(JSON.parse(response.data.note_onsets_obj));
                setCalculatingNoteOnsets(false);
            } else { 
                setError("Problem with Calculating Note Onsets");               
                }
            })

            .catch(err => console.log(err))
    }

    const [beatNos, setBeatNos] = useState([]);
    const [noteDelays, setNoteDelays] = useState([]);
    const [binMidsForGaussian, setBinMidsForGaussian] = useState([]);
    const [gaussianFit, setGaussianFit] = useState([]);
    const [analysisSummary, setAnalysisSummary] = useState("");

    const analyseRhythmButtonPressed = () => {
        setAnalysingRhythm(true)
        let analyseRhythmData = new FormData();
        analyseRhythmData.append('session_code', sessionCode);
        axios.post('/api/analyse-rhythm', analyseRhythmData, { // noteOnsetObject
            headers: {
                'content-type': 'multipart/form-data'
            }
        })
        .then((response) => {
            if(response.status==200){ 
            //console.log(response.data);
            setError("");
            setAnalysingRhythm(false)
            setBeatNos(response.data.beatNos);
            setNoteDelays(response.data.noteDelays);
            setBinMidsForGaussian(response.data.binMidsForGaussian);
            setGaussianFit(response.data.gaussianFit);
            setAnalysisSummary(JSON.parse(response.data.analysisSummary));

            navigate('/results/' + sessionCode,
                {state : {
                    beatNos: response.data.beatNos,
                    noteDelays: response.data.noteDelays,
                    binMidsForGaussian: response.data.binMidsForGaussian,
                    gaussianFit: response.data.gaussianFit,
                    analysisSummary: JSON.parse(response.data.analysisSummary),
                    username: username,
                    title: title,
                    tempo: tempo,
                    sessionCode: sessionCode,
                    sampleRate: sampleRate, 
                    waveDataJSON: waveDataJSON,
                    averager: averager,
                }}); 
            } else if (response.status==422) { // axios .then can only catch 2xx codes so this is pointless currently
                setError("Required to Calculate Note Onsets first");
            } else { 
                console.log('error')
                setError("Problem with Calculating Note Onsets");               
            }
        })

        .catch(function (err) {
            console.log(err)
            if (err.response){
            // Request made and server responded
                setError("Try calculating note onsets before analysing your rhythm");
            } else if (error.request) {
            // The request was made but no response was received
                console.log(error.request);
                setError("No response from the server");
            } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
            }
        })
    }

    //LineGraph Functions
    const [data, setData] = useState([]);

    //use any change of variable effect to regenerate data displayed
    // does once data is first loaded when rendering page
    // they also get triggered when time range changes
    useEffect(() => {
        regenerateData();
        regenerateNoteOnsets();
    }, []);

    // checks for note onsets data changing so its added to graph automatically
    useEffect(() => {
        regenerateNoteOnsets();
    }, [noteOnsets])


    
    function regenerateData() {
      const chartData = [];

      for (let i = (startTime * sampleRate); i < (endTime * sampleRate); i++) {
        const value = waveData[Math.floor(i)]
        chartData.push({
          label: i/(sampleRate),
          value,
          tooltipContent: `<b>x: </b>${i/(sampleRate)}<br><b>y: </b>${value}`
        });
      }
      setData(chartData)
    }

    // same deal for noteOnsets data changing for the time range on display
    const [noteOnsetData, setNoteOnsetData] = useState([]);

    function regenerateNoteOnsets() {
        const chartData = [];

        for (let i = (startTime * sampleRate); i < (endTime * sampleRate); i++) {
            const value = noteOnsets[Math.floor(i)]
            chartData.push({
                label: i/(sampleRate),
                value,
                tooltipContent: `<b>x: </b>${i/(sampleRate)}<br><b>y: </b>${value}`
            });
        }
        setNoteOnsetData(chartData);
    }

    // for the instructions pop over
    const [anchorEl, setAnchorEl] = React.useState(null);
    const handleInstructionsClick = (event) => {
      setAnchorEl(event.currentTarget);
    };
  
    const handleInstructionsClose = () => {
      setAnchorEl(null);
    };
  
    const instructionsOpen = Boolean(anchorEl);
    const instruction = instructionsOpen ? 'simple-popover' : undefined;
  



    return (
        <Grid container spacing={2} align="center">

        <Grid item xs={12}>
        <Typography variant="h4" compact="h4">
            Hello {username}! Let's start analysing {title}.
        </Typography>
        </Grid>

        
        
        <Grid item align="left" xs={10}>
            <Button aria-describedby={instruction} variant="contained" onClick={handleInstructionsClick}>
            Instructions
            </Button>
            <Popover
            id={instruction}
            open={instructionsOpen}
            anchorEl={anchorEl}
            onClose={handleInstructionsClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            >
            
            <Typography sx={{ p: 2 }} variant="h6" compact="h6">
            First let's optimize the detection of note onsets.</Typography>
            <Typography sx={{ p: 2 }}>Below you will find the graphical representation of your music.
            You can scroll through it and zoom in using the Start Time and Time Range on Display sliders.</Typography>
            <Typography sx={{ p: 2 }} >
                To optimize the note onset (start of new notes) detection, we need to set the Threshold.
                By moving the Threshold slider, you will see the threshold level change on the graph. 
                Set it so that it is about level with the start of most of your notes.
            </Typography>
            <Typography sx={{ p: 2 }} >
                Then hit the Calculate Note Onsets button. This will send back the calculated note onsets,
                and show them on the graph. A green vertical line for every new note detected. 
                If you feel that not all note starts are detected, lower the threshold and run the calculation again.
                Alternatively, if too many notes are detected, increase the threshold level and run it again.
            </Typography>
            <Typography  sx={{ p: 2 }} variant="h6" compact="h6" >
                When your satisfied with the note onset calculation, hit analyse my rhythm!
            </Typography>


            </Popover>
        </Grid>

        <Grid item align="center" xs={12}>
            <div className="NoteOnsetGraph">
            
            <LineChart data={data} threshold={threshold} noteOnsets={noteOnsetData} 
            ymin={minval} ymax={maxval} width={600} height={300} />
            </div>
            
            <IconButton align="right"> 
            <PlayCircleFilledWhiteIcon color="secondary" fontSize="large"/>
            </IconButton>
        </Grid>

        

        
        <Grid item xs={4} >    
        <FormControl component="fieldset">
        <Typography id="threshold-slider" gutterBottom>
            Threshold
        </Typography>
        
        <Slider 
            aria-label="Threshold Level" 
            value={threshold} 
            onChange={handleThresholdChange} 
            min={0}
            max={Math.max.apply(null, waveData)} // the .apply null bit avoids NaN from floats 
            color="secondary"
            //valueLabelDisplay="auto"
        />
        
        <FormHelperText>
                <div align="center">
                    Change ampltiude threshold for note detection</div>
        </FormHelperText>
        </FormControl>
        </Grid>

        <Grid item xs={4} >
        <Typography id="startTime-slider" gutterBottom>
            Start Time on Display
        </Typography>
        <Slider 
            aria-label="Start Time on Display" 
            value={startTime} 
            onChange={handleTimeRangeChange} 
            min={0}
            max={musicTotalLength-timeWindow}
            valueLabelDisplay="auto"
        />
        <FormHelperText>
                <div align="center">
                    Scroll through your music file</div>
        </FormHelperText>
        </Grid>

        <Grid item xs={4} sx={{flexDirection: 'row', display: 'inline' }}>
        <Typography id="timeRange-slider" gutterBottom>
            Time Range on Display
        </Typography>
        <Slider 
            aria-label="Time Range on Display" 
            value={timeWindow}
            onChange={handleTimeWindowChange} 
            min={2}
            max={20}
            valueLabelDisplay="auto"
        />
        <FormHelperText>
                <div align="center">
                    Zoom in/out</div>
        </FormHelperText>
        </Grid>

        

        
        <Grid item xs={6}>
        <LoadingButton 
        onClick={calculateNoteOnsets} 
        color='primary' 
        variant='contained'
        loading={calculatingNoteOnsets}
        >Calculate Note Onsets</LoadingButton>
        </Grid>
        <Grid item xs={6}>
        <LoadingButton 
        
        onClick={analyseRhythmButtonPressed} 
        loading={analysingRhythm}
        color='secondary' 
        variant='contained'
        >Analyse my rhythm!</LoadingButton>
        </Grid>

        <Grid item xs={12}>
            <Typography variant="h5">{error}</Typography>
        </Grid>

        </Grid>

        
        )
        // could be useful when only want to show something that exists
        // { location != null ? <div>{location.state.name}</div> : ""}
}

/*

        <div className="graph">
            <LineChart data={data} width={400} height={300} />
        </div>
        
        */

        /*
                <Slider
            getAriaLabel={() => 'Time range on Display'}
            value={value}
            onChange={handleTimeRangeChange}
            valueLabelDisplay="auto"
            getAriaValueText={valueText}
            />
                */