import React, { useState } from "react";
import { Grid, Button, Typography, FormControl, FormHelperText, 
    FormControlLabel, RadioGroup, Radio, TextField, Box, Popover } from '@mui/material';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

export default function UploadPage(props) {
    
    // setting initial states
    const [username, setUsername] = useState("");
    const [title, setTitle] = useState("");
    const [tempo, setTempo] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState("no file selected");
    const [error, setError] = useState("");
    const [errorTempo, setErrorTempo] = useState("");
    const [errorName, setErrorName] = useState("");   
    const [waveData, setWaveData] = useState("");
    const [sampleRate, setSampleRate] = useState("");
    const [sessionCode, setSessionCode] = useState("");

    const navigate = useNavigate()

    const selectFile = (e) => {
          setSelectedFile(e.target.files[0]);
          setFileName(e.target.files[0].name);
    }

    const handleTempoChange = (e) => {
            setTempo(e.target.value)
    }
      
    const handleNameChange = (e) => {
            setUsername(e.target.value)
    }

    const handleTitleChange = (e) => {
            setTitle(e.target.value)
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
      

    const uploadButtonPressed = () => {
        console.log(selectedFile.type)
        if (!tempo == "" && 20 > tempo || 300 < tempo){
                setErrorTempo("tempo outside of range (20-300)");
                setTempo("") // don't pass the bad value along
        } else { setErrorTempo("")}
        if (username === "") {
                setErrorName("Please enter your name")
            return
        }
        if (selectedFile == null) {
                setError("No file chosen for upload")
            return
        }
        if (selectedFile.type != "audio/wav" && selectedFile.type != "audio/mpeg"){
                setError("File is not a .wav or .mp3 file");
            return
        }

        let uploadData = new FormData();
        uploadData.append('username', username);
        uploadData.append('title', title);
        uploadData.append('tempo', tempo);
        uploadData.append('file', selectedFile);
        
        // now post it
        var $csrf_token = $('[name="csrfmiddlewaretoken"]').attr('value'); // csrf for cross website protection (can only access from here)

        axios.post('/api/upload', uploadData, {
            headers: {
                'content-type': 'multipart/form-data'
            }
        })
            .then((response) => {
                if(response.status==200){
                setError("")
                //console.log(response.data);
                // go to session page using the code and transfer the data with it
                navigate('/session/' + response.data.session_code,
                {state : {
                    sampleRate: response.data.rate, 
                    waveData: response.data.wav_data_json,
                    averager: response.data.averager,
                    username: username,
                    title: title,
                    tempo: tempo,
                    sessionCode: response.data.session_code,
                }}); 
                //{username, title, tempo, waveData, sampleRate}); 
            } else { 
                setError("Problem with uploading File. Try a smaller file or compressing your file.");
                return 
                }
            })

            .catch(err => console.log(err))
    };

        
    


    return (
        <Grid container spacing={3} align="center">

        <Grid item xs={12}>
            <Typography variant="h4" compact="h4">
                Upload your .wav or .mp3 file for rhythm analysis
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
            Choose a .wav or .mp3 file for upload</Typography>
            <Typography sx={{ p: 2 }}>Real Rhythm Test works best if you upload a recording of just one instrument, 
            rather than a mix of a whole band. Other wise it can be difficult to detect the onsets of new notes.</Typography>
            <Typography sx={{ p: 2 }}>After choosing your music file, fill in the Tempo if you played to a metronome/click, 
            or leave it blank if you played without or do not know the tempo,
             add your name (mandatory) and the title of your track if you have one (optional). </Typography>
             <Typography sx={{ p: 2 }}>When you're ready, press UPLOAD to proceed.</Typography>
            </Popover>
        </Grid>

        <Grid item xs={12}>
        <FormControl component="fieldset">
        <label htmlFor="btn-upload">
          <input
            id="btn-upload"
            name="btn-upload"
            style={{ display: 'none' }}
            type="file"
            onChange={selectFile} />
          <Button
            className="btn-choose"
            variant="outlined"
            component="span" >
             Choose File
          </Button>
          <FormHelperText>
                <div align="center">
                    {fileName}</div>
            </FormHelperText>
        </label>
        </FormControl> 
        </Grid>

        <Grid item xs={12}>
        <FormControl>
            <TextField 
            required={false} 
            type="number" 
            defaultValue=""
            onChange={handleTempoChange}
            helperText={errorTempo}  
            error={errorTempo} 
            inputProps={{
                style: {textAlign: "center"},
                min: 20,
            }}
            />
            <FormHelperText>
                <div align="center">
                    Tempo (only if known)</div>
            </FormHelperText>
        </FormControl> 
        </Grid>
        
        <Grid item xs={12}>
        <FormControl>
            <TextField 
            required={true} 
            type="text" 
            defaultValue=""
            onChange={handleNameChange}
            helperText={errorName}  
            error={errorName}  
            inputProps={{
                style: {textAlign: "center"},
            }}
            />
            <FormHelperText>
                <div align="center">
                    Your Name</div>
            </FormHelperText>
        </FormControl> 
        </Grid>

        <Grid item xs={12}>
        <FormControl>
            <TextField 
            required={false} 
            type="text" 
            defaultValue=""
            onChange={handleTitleChange}
            inputProps={{
                style: {textAlign: "center"},
            }}
            />
            <FormHelperText>
                <div align="center">
                    Music Title (optional)</div>
            </FormHelperText>
        </FormControl> 
        </Grid>
        
        <Grid item xs={12}>
        <Button color="secondary" variant="contained" onClick={uploadButtonPressed}> 
            Upload
        </Button>    
        <Grid item xs={12}>
            <p className="uploadFileError">{error}</p>
        </Grid>
        </Grid>
        </Grid>

    )
}