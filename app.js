// FUSE VOID Web Studio - Interaction Logic

const API_URL = "https://fuse-void-api.fuseboogie.workers.dev";
let authToken = null;

// System Modal Logic
window.showSysMsg = function(message, isError = true) {
    const modal = document.getElementById('sys-modal');
    const panel = document.getElementById('sys-modal-panel');
    const title = document.getElementById('sys-modal-title');
    const msg = document.getElementById('sys-modal-message');
    const btn = document.getElementById('sys-modal-btn');
    
    msg.textContent = message;
    
    if (isError) {
        panel.style.borderColor = '#ff0032';
        panel.style.boxShadow = '0 0 30px rgba(255,0,50,0.2)';
        title.style.color = '#ff0032';
        title.textContent = 'CRITICAL ERROR';
        btn.style.borderColor = '#ff0032';
        btn.style.color = '#ff0032';
        btn.style.background = 'rgba(255,0,50,0.1)';
    } else {
        panel.style.borderColor = 'var(--accent-cyan)';
        panel.style.boxShadow = '0 0 30px rgba(0,243,255,0.2)';
        title.style.color = 'var(--accent-cyan)';
        title.textContent = 'SYSTEM NOTIFICATION';
        btn.style.borderColor = 'var(--accent-cyan)';
        btn.style.color = 'var(--accent-cyan)';
        btn.style.background = 'rgba(0,243,255,0.1)';
    }
    
    modal.style.display = 'flex';
};

try {
    authToken = localStorage.getItem('fuse_void_token');
} catch (e) {
    console.warn("LocalStorage blocked for file:// protocol");
}

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileUpload = document.getElementById('file-upload');
    const processBtn = document.getElementById('process-btn');
    const statusIndicator = document.querySelector('.status-indicator');
    
    // Auth Elements
    const userAvatar = document.querySelector('.user-avatar');
    const authModal = document.getElementById('auth-modal');
    const closeAuthBtn = document.getElementById('close-auth-btn');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authSwitchLink = document.getElementById('auth-switch-link');
    const authTitle = document.getElementById('auth-title');
    const authError = document.getElementById('auth-error');
    const creditValue = document.querySelector('.credit-value');

    let isLoginMode = true;
    let selectedFile = null;

    // --- UI INITIATION ---
    if (authToken) {
        creditValue.textContent = "VERIFYING...";
        userAvatar.style.color = "var(--accent-cyan)";
        
        fetch(API_URL + "/api/auth/me", {
            headers: { "Authorization": "Bearer " + authToken }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                creditValue.textContent = parseFloat(data.minutes).toFixed(2) + " MIN";
            } else {
                creditValue.textContent = "OFFLINE";
                authToken = null;
                localStorage.removeItem('fuse_void_token');
            }
        })
        .catch(e => creditValue.textContent = "OFFLINE");
    } else {
        creditValue.textContent = "OFFLINE";
    }

    // Show/hide logout button based on login status
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        if (authToken) {
            logoutBtn.style.display = 'block';
            logoutBtn.onclick = () => {
                localStorage.removeItem('fuse_void_token');
                window.location.reload();
            };
        } else {
            logoutBtn.style.display = 'none';
        }
    }

    // --- AUTHENTICATION LOGIC ---
    /* 
    // GEÇİCİ OLARAK KAPATILDI (WEB ÖDEMELERİ AÇILANA KADAR)
    userAvatar.addEventListener('click', () => {
        authModal.style.display = 'flex';
        authError.style.display = 'none';
    });
    */

    closeAuthBtn.addEventListener('click', () => {
        authModal.style.display = 'none';
    });
    
    document.getElementById('open-terms-btn').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('terms-modal').style.display = 'flex';
    });

    let authStep = 1; // 1: Email, 2: Code

    authSubmitBtn.addEventListener('click', async () => {
        const email = document.getElementById('auth-email').value;
        const codeInput = document.getElementById('auth-code');
        const termsCheckbox = document.getElementById('auth-terms-checkbox');
        
        if (!email) {
            authError.textContent = "EMAIL REQUIRED";
            authError.style.display = 'block';
            return;
        }

        if (authStep === 1) {
            authSubmitBtn.textContent = "SENDING CODE...";
            authError.style.display = 'none';

            try {
                const response = await fetch(API_URL + "/api/auth/send-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();

                if (!response.ok) throw new Error(data.error || "Failed to send code");

                // Switch to Step 2
                authStep = 2;
                document.getElementById('auth-email').style.display = 'none';
                document.getElementById('auth-terms-container').style.display = 'none';
                codeInput.style.display = 'block';
                authSubmitBtn.textContent = "VERIFY";
                
            } catch (err) {
                authError.textContent = err.message;
                authError.style.display = 'block';
                authSubmitBtn.textContent = "INITIATE";
            }
        } else if (authStep === 2) {
            const code = codeInput.value;
            if (!code || code.length !== 6) {
                authError.textContent = "INVALID 6-DIGIT CODE";
                authError.style.display = 'block';
                return;
            }

            authSubmitBtn.textContent = "VERIFYING...";
            authError.style.display = 'none';

            try {
                const response = await fetch(API_URL + "/api/auth/verify-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, code })
                });
                const data = await response.json();

                if (!response.ok) throw new Error(data.error || "Authentication Failed");

                // Success
                authToken = data.token;
                localStorage.setItem('fuse_void_token', authToken);
                
                let minutes = data.minutes !== undefined ? data.minutes : 0;
                creditValue.textContent = minutes + " MIN";
                userAvatar.style.color = "var(--accent-cyan)";
                
                authModal.style.display = 'none';
                showSysMsg("SYSTEM ACCESS GRANTED", false);
                
                // Reset for next time
                authStep = 1;
                document.getElementById('auth-email').style.display = 'block';
                document.getElementById('auth-terms-container').style.display = 'flex';
                codeInput.style.display = 'none';
                codeInput.value = '';
                authSubmitBtn.textContent = "INITIATE";
                
            } catch (err) {
                authError.textContent = err.message;
                authError.style.display = 'block';
                authSubmitBtn.textContent = "VERIFY";
            }
        }
    });

    // --- DRAG & DROP LOGIC ---
    // Prevent default browser behavior globally so it doesn't open the MP3 in a new tab
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = 'var(--accent-cyan)';
            dropZone.style.background = 'rgba(0, 243, 255, 0.05)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            dropZone.style.background = 'rgba(20, 20, 20, 0.5)';
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        handleFiles(e.dataTransfer.files);
    });

    fileUpload.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            selectedFile = files[0];
            
            if (!selectedFile.type.startsWith('audio/') && !selectedFile.name.match(/\.(mp3|wav|m4a|flac)$/i)) {
                showSysMsg('CRITICAL ERROR: Invalid file format. Audio files only.');
                return;
            }
            
            // Enforce 50MB size limit
            const maxSizeInBytes = 50 * 1024 * 1024;
            if (selectedFile.size > maxSizeInBytes) {
                showSysMsg('CRITICAL ERROR: File size exceeds 50MB limit.');
                return;
            }

            dropZone.querySelector('h2').textContent = 'FILE ACQUIRED';
            dropZone.querySelector('p').textContent = selectedFile.name;
            dropZone.querySelector('p').style.color = 'var(--text-primary)';
            
            // Show and load the original audio player
            const audioPlayer = document.getElementById('original-audio-player');
            const fileURL = URL.createObjectURL(selectedFile);
            audioPlayer.src = fileURL;
            audioPlayer.style.display = 'none';
            
            const playerBox = document.getElementById('original-player-box');
            if (playerBox) {
                playerBox.style.opacity = '1';
                document.getElementById('master-status-led').style.background = '#00ff44';
                document.getElementById('master-status-led').style.boxShadow = '0 0 8px #00ff44';
                
                const masterPlayBtn = document.getElementById('master-play-btn');
                masterPlayBtn.style.cursor = 'pointer';
                masterPlayBtn.innerHTML = '▶ PLAY';
                
                const masterSeek = document.getElementById('master-seek');
                masterSeek.disabled = false;
                masterSeek.style.cursor = 'pointer';
                
                document.getElementById('master-waveform-bars').style.opacity = '1';
                document.getElementById('master-time').style.color = 'var(--accent-cyan)';
            }
            const masterPlayBtn = document.getElementById('master-play-btn');
            const masterSeek = document.getElementById('master-seek');
            const masterTime = document.getElementById('master-time');
            
            if (masterPlayBtn) {
                masterPlayBtn.onclick = () => {
                    if (audioPlayer.paused) {
                        audioPlayer.play();
                        masterPlayBtn.innerHTML = '⏸ PAUSE';
                        masterPlayBtn.style.boxShadow = '0 0 15px rgba(0,243,255,0.4)';
                    } else {
                        audioPlayer.pause();
                        masterPlayBtn.innerHTML = '▶ PLAY';
                        masterPlayBtn.style.boxShadow = 'inset 0 0 10px rgba(0,243,255,0.05)';
                    }
                };
                
                let isMasterSeeking = false;
                masterSeek.onmousedown = () => isMasterSeeking = true;
                masterSeek.onmouseup = (ev) => {
                    isMasterSeeking = false;
                    audioPlayer.currentTime = (ev.target.value / 100) * audioPlayer.duration;
                };
                masterSeek.oninput = (ev) => {
                    const masterProgressFill = document.getElementById('master-progress-fill');
                    if (masterProgressFill) {
                        masterProgressFill.style.width = ev.target.value + '%';
                    }
                };
                
                audioPlayer.ontimeupdate = () => {
                    if (!audioPlayer.duration) return;
                    const remaining = audioPlayer.duration - audioPlayer.currentTime;
                    const mins = Math.floor(remaining / 60);
                    const secs = Math.floor(remaining % 60);
                    masterTime.textContent = `-${mins}:${secs.toString().padStart(2, '0')}`;
                    
                    if (!isMasterSeeking) {
                        const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                        masterSeek.value = pct;
                        const masterProgressFill = document.getElementById('master-progress-fill');
                        if (masterProgressFill) {
                            masterProgressFill.style.width = pct + '%';
                        }
                    }
                };
            }
            
            audioPlayer.onloadedmetadata = () => {
                const durationSeconds = audioPlayer.duration;
                
                if (durationSeconds > 480) {
                    showSysMsg('CRITICAL ERROR: MAXIMUM 8 MINUTES EXCEEDED.');
                    resetDropZoneUI();
                    return;
                }
                
                if (durationSeconds < 15) {
                    showSysMsg('CRITICAL ERROR: MINIMUM DURATION IS 15 SECONDS. NEURAL ENGINE REQUIRES MORE CONTEXT DATA.');
                    resetDropZoneUI();
                    return;
                }
                
                function resetDropZoneUI() {
                    dropZone.querySelector('h2').textContent = 'INITIATE EXTRACTION';
                    dropZone.querySelector('p').textContent = 'Drag & Drop your audio file here (MP3, WAV, M4A)';
                    dropZone.querySelector('p').style.color = 'var(--text-secondary)';
                    processBtn.classList.add('disabled');
                    if (playerBox) {
                        playerBox.style.opacity = '0.35';
                        document.getElementById('master-status-led').style.background = '#555';
                        document.getElementById('master-status-led').style.boxShadow = 'none';
                        const masterPlayBtn = document.getElementById('master-play-btn');
                        masterPlayBtn.style.cursor = 'not-allowed';
                        const masterSeek = document.getElementById('master-seek');
                        masterSeek.disabled = true;
                        masterSeek.style.cursor = 'not-allowed';
                        masterSeek.value = 0;
                        const masterProgressFill = document.getElementById('master-progress-fill');
                        if (masterProgressFill) masterProgressFill.style.width = '0%';
                        
                        document.getElementById('master-waveform-bars').style.opacity = '0.3';
                        document.getElementById('master-time').style.color = '#555';
                        document.getElementById('master-time').textContent = '00:00';
                    }
                    selectedFile = null;
                    return;
                }
                selectedFile.duration = durationSeconds; // Store for later
                
                // Initialize countdown display
                const mins = Math.floor(durationSeconds / 60);
                const secs = Math.floor(durationSeconds % 60);
                const masterTime = document.getElementById('master-time');
                if (masterTime) {
                    masterTime.textContent = `-${mins}:${secs.toString().padStart(2, '0')}`;
                }

                processBtn.classList.remove('disabled');
                processBtn.style.boxShadow = '0 0 20px rgba(0, 243, 255, 0.3)';
                statusIndicator.textContent = `READY (${(durationSeconds / 60).toFixed(2)} MIN)`;
                statusIndicator.style.color = 'var(--accent-cyan)';
                statusIndicator.style.borderColor = 'var(--accent-cyan)';
                
                document.querySelectorAll('.track-status-led').forEach(led => {
                    led.style.background = 'var(--accent-cyan)';
                    led.style.boxShadow = '0 0 5px var(--accent-cyan)';
                });
            };
        }
    }

    // --- PROCESS (RUNPOD) LOGIC ---
    processBtn.addEventListener('click', async () => {
        if (processBtn.classList.contains('disabled')) return;
        
        const euWaiver = document.getElementById('eu-withdrawal-waiver');
        if (euWaiver && !euWaiver.checked) {
            showSysMsg("YOU MUST AGREE TO THE WITHDRAWAL WAIVER TO PROCEED.");
            euWaiver.parentElement.style.color = "#ff0032";
            setTimeout(() => { if(euWaiver.parentElement) euWaiver.parentElement.style.color = "#888"; }, 1500);
            return;
        }
        
        if (!authToken) {
            authModal.style.display = 'flex';
            authTitle.textContent = "LOGIN REQUIRED FOR EXTRACTION";
            return;
        }

        const creditEl = document.querySelector('.credit-value');
        const creditText = creditEl ? creditEl.textContent : "0 MIN";
        
        if (creditText === "0 MIN" || creditText === "0") {
            showSysMsg("INSUFFICIENT BALANCE. YOU MUST PURCHASE MINUTES TO RUN THE NEURAL ENGINE.");
            return;
        }

        processBtn.textContent = "UPLOADING TO R2 CLOUD...";
        processBtn.classList.add('disabled');

        try {
            // 1. Get Secure Upload URL
            const urlRes = await fetch(API_URL + "/api/upload-url", {
                method: "POST",
                headers: { 
                    "Authorization": "Bearer " + authToken,
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ filename: selectedFile.name })
            });
            const urlData = await urlRes.json();
            
            if (!urlRes.ok) throw new Error(urlData.error || "Failed to generate secure upload link");
            
            // 2. Direct Upload to R2 Bucket
            const uploadRes = await fetch(urlData.upload_url, {
                method: "PUT",
                body: selectedFile,
                headers: {
                    "Content-Type": selectedFile.type || "application/octet-stream"
                }
            });

            if (!uploadRes.ok) throw new Error("R2 Cloud Upload Failed");

            processBtn.textContent = "INITIALIZING RUNPOD v9...";

            // 3. Send Signal to Neural Engine
            const response = await fetch(API_URL + "/api/process", {
                method: "POST",
                headers: { 
                    "Authorization": "Bearer " + authToken,
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ 
                    filename: urlData.file_key, // Use the secure unique key in R2
                    duration: selectedFile.duration
                })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Extraction Failed");
            }

            // Deduct minute from UI (Format to 2 decimals)
            creditValue.textContent = parseFloat(data.remaining_minutes).toFixed(2) + " MIN";
            
            // Here we start polling RunPod for the separated files
            const spinnerContainer = document.getElementById('extraction-spinner');
            const spinnerPct = document.getElementById('spinner-pct');
            const spinnerStatus = document.getElementById('spinner-status');
            const spinnerCircle = document.getElementById('spinner-progress-circle');
            
            let currentServerStatus = "INITIALIZING";
            if (spinnerContainer) {
                spinnerContainer.style.display = 'flex';
                if (spinnerCircle) spinnerCircle.style.strokeDashoffset = 283;
                let pct = 0;
                let ticks = 0;
                
                const queueMsgs = ["ALLOCATING SERVER...", "WAKING GPU COMPUTE...", "ESTABLISHING UPLINK...", "AWAITING NODE READY..."];
                const progMsgs = ["ANALYZING FREQUENCIES...", "ISOLATING VOCAL TRACT...", "EXTRACTING TRANSIENTS...", "SEPARATING HARMONICS...", "NEURAL PROCESSING..."];
                
                const pctInterval = setInterval(() => {
                    ticks++;
                    if (pct < 99) {
                        pct += 1;
                        spinnerPct.textContent = pct + "%";
                        if (spinnerCircle) {
                            const offset = 283 - (pct / 100 * 283);
                            spinnerCircle.style.strokeDashoffset = offset;
                        }
                    }
                    
                    // Rotate text every 2 seconds (2 ticks)
                    if (ticks % 2 === 0 && spinnerStatus) {
                        let msgs = [currentServerStatus];
                        if (currentServerStatus === "IN_QUEUE") msgs = queueMsgs;
                        else if (currentServerStatus === "IN_PROGRESS") msgs = progMsgs;
                        
                        spinnerStatus.textContent = msgs[(ticks / 2) % msgs.length];
                    }
                }, 1000); 
                spinnerContainer.dataset.intervalId = pctInterval;
            }

            const pollStartTime = Date.now();
            const pollStatus = async (jobId) => {
                try {
                    if (Date.now() - pollStartTime > 480000) { // 8 minutes timeout
                        throw new Error("Polling timeout: The server took too long to process (exceeded 8 minutes).");
                    }
                    
                    const statusRes = await fetch(API_URL + "/api/status", {
                        method: "POST",
                        headers: { 
                            "Authorization": "Bearer " + authToken,
                            "Content-Type": "application/json" 
                        },
                        body: JSON.stringify({ job_id: jobId })
                    });
                    const statusData = await statusRes.json();
                    
                    if (statusData.status === "COMPLETED") {
                        if (spinnerContainer) {
                            clearInterval(parseInt(spinnerContainer.dataset.intervalId));
                            spinnerPct.textContent = "100%";
                            spinnerStatus.textContent = "DECODING AUDIO DATA...";
                            setTimeout(() => {
                                spinnerContainer.style.display = 'none';
                                processBtn.textContent = "EXTRACTION COMPLETE";
                                processBtn.classList.remove('disabled');
                                processBtn.style.boxShadow = '0 0 20px rgba(0, 255, 100, 0.4)';
                                buildMultiTrackPlayer(statusData.stems);
                            }, 1000);
                        } else {
                            processBtn.textContent = "EXTRACTION COMPLETE";
                            processBtn.classList.remove('disabled');
                            processBtn.style.boxShadow = '0 0 20px rgba(0, 255, 100, 0.4)';
                            buildMultiTrackPlayer(statusData.stems);
                        }
                    } else if (statusData.status === "FAILED" || statusData.error) {
                        if (spinnerContainer) {
                            clearInterval(parseInt(spinnerContainer.dataset.intervalId));
                            spinnerContainer.style.display = 'none';
                        }
                        showSysMsg("EXTRACTION FAILED: " + (statusData.error || "Unknown Error"));
                        processBtn.textContent = "EXECUTE SEPARATION";
                        processBtn.classList.remove('disabled');
                    } else {
                        processBtn.textContent = `PROCESSING...`;
                        currentServerStatus = statusData.status;
                        setTimeout(() => pollStatus(jobId), 5000); 
                    }
                } catch (e) {
                    console.error("Polling error:", e);
                    if (e.message && e.message.includes("Polling timeout")) {
                        if (spinnerContainer) {
                            clearInterval(parseInt(spinnerContainer.dataset.intervalId));
                            spinnerContainer.style.display = 'none';
                        }
                        showSysMsg("SYSTEM ERROR: " + e.message);
                        processBtn.textContent = "EXECUTE SEPARATION";
                        processBtn.classList.remove('disabled');
                    } else {
                        setTimeout(() => pollStatus(jobId), 5000);
                    }
                }
            };
            
            pollStatus(data.job_id);

        } catch (err) {
            const spinnerContainer = document.getElementById('extraction-spinner');
            if (spinnerContainer) {
                if (spinnerContainer.dataset.intervalId) clearInterval(parseInt(spinnerContainer.dataset.intervalId));
                spinnerContainer.style.display = 'none';
            }
            showSysMsg("SYSTEM ERROR: " + err.message);
            processBtn.textContent = "EXECUTE SEPARATION";
            processBtn.classList.remove('disabled');
        }
    });

    // --- MULTI-TRACK PLAYER BUILDER ---
    function buildMultiTrackPlayer(stems) {
        const trackPlayers = {};
        const trackItems = document.querySelectorAll('.track-item');
        const downloadAllBtn = document.getElementById('download-all-btn');
        let hasStems = false;
        
        trackItems.forEach(item => {
            const trackName = item.querySelector('.track-name').textContent.toLowerCase();
            const waveformContainer = item.querySelector('.track-waveform');
            const trackInfo = item.querySelector('.track-info');
            let stemUrl = null;
            const stemKeys = Object.keys(stems || {});
            
            for (let key of stemKeys) {
                if (key.toLowerCase().includes(trackName)) {
                    stemUrl = stems[key];
                    hasStems = true;
                    break;
                }
            }
            if (!stemUrl && trackName === "beat") {
                const beatKey = stemKeys.find(k => k.toLowerCase().includes("instrumental"));
                if (beatKey) { stemUrl = stems[beatKey]; hasStems = true; }
            }
            if (!stemUrl && trackName === "melody") {
                const melodyKey = stemKeys.find(k => k.toLowerCase().includes("other"));
                if (melodyKey) { stemUrl = stems[melodyKey]; hasStems = true; }
            }
            
            if (stemUrl) {
                waveformContainer.classList.remove('empty');
                waveformContainer.innerHTML = '';
                
                const audioEl = document.createElement('audio');
                audioEl.src = stemUrl;
                audioEl.preload = "auto";
                audioEl.crossOrigin = "anonymous";
                trackPlayers[trackName] = audioEl;
                
                const playerUI = document.createElement('div');
                playerUI.style.display = "flex";
                playerUI.style.alignItems = "center";
                playerUI.style.gap = "15px";
                playerUI.style.width = "100%";
                playerUI.style.padding = "0 20px";
                playerUI.style.boxSizing = "border-box";
                
                const playBtn = document.createElement('button');
                playBtn.innerHTML = "▶";
                playBtn.style.background = "rgba(0, 243, 255, 0.05)";
                playBtn.style.border = "1px solid var(--accent-cyan)";
                playBtn.style.color = "var(--accent-cyan)";
                playBtn.style.borderRadius = "4px";
                playBtn.style.flex = "1";
                playBtn.style.height = "26px";
                playBtn.style.cursor = "pointer";
                playBtn.style.display = "flex";
                playBtn.style.alignItems = "center";
                playBtn.style.justifyContent = "center";
                playBtn.style.fontSize = "0.7rem";
                playBtn.style.transition = "all 0.2s ease";
                
                const muteBtn = document.createElement('button');
                muteBtn.innerHTML = "MUTE";
                muteBtn.style.background = "rgba(255, 255, 255, 0.05)";
                muteBtn.style.border = "1px solid #555";
                muteBtn.style.color = "#888";
                muteBtn.style.borderRadius = "4px";
                muteBtn.style.flex = "1";
                muteBtn.style.height = "26px";
                muteBtn.style.fontSize = "0.65rem";
                muteBtn.style.fontFamily = "'Orbitron', sans-serif";
                muteBtn.style.letterSpacing = "1px";
                muteBtn.style.cursor = "pointer";
                muteBtn.style.transition = "all 0.2s ease";
                
                const volTrack = document.createElement('div');
                volTrack.style.flex = "1";
                volTrack.style.height = "4px";
                volTrack.style.background = "rgba(255,255,255,0.1)";
                volTrack.style.borderRadius = "2px";
                volTrack.style.position = "relative";
                volTrack.style.display = "flex";
                volTrack.style.alignItems = "center";
                
                const volSlider = document.createElement('input');
                volSlider.type = "range";
                volSlider.className = "cyber-slider";
                volSlider.min = "0";
                volSlider.max = "1";
                volSlider.step = "0.01";
                volSlider.value = "1";
                volSlider.style.width = "100%";
                volSlider.style.position = "absolute";
                volSlider.style.margin = "0";
                volSlider.style.height = "20px";
                
                volTrack.appendChild(volSlider);
                
                const downloadBtn = document.createElement('a');
                downloadBtn.innerHTML = "⬇ DL";
                downloadBtn.href = stemUrl;
                downloadBtn.download = `${trackName}_stem.wav`;
                downloadBtn.target = "_blank";
                downloadBtn.style.background = "rgba(0, 243, 255, 0.1)";
                downloadBtn.style.border = "1px solid var(--accent-cyan)";
                downloadBtn.style.color = "var(--accent-cyan)";
                downloadBtn.style.borderRadius = "4px";
                downloadBtn.style.padding = "4px 10px";
                downloadBtn.style.fontSize = "0.7rem";
                downloadBtn.style.cursor = "pointer";
                downloadBtn.style.textDecoration = "none";
                downloadBtn.style.marginLeft = "auto";
                downloadBtn.style.fontFamily = "'Orbitron', sans-serif";
                downloadBtn.style.fontWeight = "bold";
                
                // Find or create controls container
                let controlsContainer = trackInfo.querySelector('.track-controls-container');
                if (controlsContainer) {
                    controlsContainer.innerHTML = '';
                    controlsContainer.style.opacity = '1';
                    controlsContainer.style.pointerEvents = 'auto';
                } else {
                    controlsContainer = document.createElement('div');
                    controlsContainer.className = 'track-controls-container';
                    controlsContainer.style.width = "100%";
                    trackInfo.appendChild(controlsContainer);
                }
                
                const controlsRow = document.createElement('div');
                controlsRow.style.display = "flex";
                controlsRow.style.gap = "8px";
                controlsRow.style.marginTop = "12px";
                controlsRow.style.width = "100%";
                controlsRow.appendChild(playBtn);
                controlsRow.appendChild(muteBtn);
                
                const volRow = document.createElement('div');
                volRow.style.display = "flex";
                volRow.style.alignItems = "center";
                volRow.style.gap = "8px";
                volRow.style.marginTop = "10px";
                volRow.style.width = "100%";
                
                const volLabel = document.createElement('span');
                volLabel.innerHTML = "VOL";
                volLabel.style.fontFamily = "'Orbitron', sans-serif";
                volLabel.style.fontSize = "0.55rem";
                volLabel.style.color = "var(--accent-cyan)";
                volLabel.style.letterSpacing = "1px";
                
                volRow.appendChild(volLabel);
                volRow.appendChild(volTrack);
                
                controlsContainer.appendChild(controlsRow);
                controlsContainer.appendChild(volRow);
                
                playerUI.appendChild(downloadBtn);
                waveformContainer.appendChild(playerUI);
                
                playBtn.addEventListener('click', () => {
                    if (audioEl.paused) {
                        audioEl.play();
                        playBtn.innerHTML = "⏸";
                        } else {
                        audioEl.pause();
                        playBtn.innerHTML = "▶";
                        }
                });
                
                muteBtn.addEventListener('click', () => {
                    audioEl.muted = !audioEl.muted;
                    if (audioEl.muted) {
                        muteBtn.style.borderColor = "#ff0032";
                        muteBtn.style.color = "#ff0032";
                    } else {
                        muteBtn.style.borderColor = "#888";
                        muteBtn.style.color = "#888";
                    }
                });
                
                volSlider.addEventListener('input', (e) => {
                    audioEl.volume = e.target.value;
                });
                
                const seekContainer = document.createElement('div');
                seekContainer.style.position = "relative";
                seekContainer.style.flex = "1";
                seekContainer.style.height = "4px";
                seekContainer.style.background = "rgba(255,255,255,0.1)";
                seekContainer.style.borderRadius = "2px";
                seekContainer.style.marginLeft = "10px";
                seekContainer.style.display = "flex";
                seekContainer.style.alignItems = "center";
                
                const seekInput = document.createElement('input');
                seekInput.type = "range";
                seekInput.min = "0";
                seekInput.max = "100";
                seekInput.value = "0";
                seekInput.className = "cyber-slider";
                seekInput.style.position = "absolute";
                seekInput.style.left = "0";
                seekInput.style.width = "100%";
                seekInput.style.margin = "0";
                seekInput.style.zIndex = "5";
                
                const seekFill = document.createElement('div');
                seekFill.style.position = "absolute";
                seekFill.style.left = "0";
                seekFill.style.top = "0";
                seekFill.style.height = "100%";
                seekFill.style.width = "0%";
                seekFill.style.background = "var(--accent-cyan)";
                seekFill.style.borderRadius = "2px";
                seekFill.style.pointerEvents = "none";
                seekFill.style.boxShadow = "0 0 10px var(--accent-cyan)";
                
                seekContainer.appendChild(seekInput);
                seekContainer.appendChild(seekFill);
                playerUI.insertBefore(seekContainer, downloadBtn);
                
                let isSeeking = false;
                seekInput.onmousedown = () => isSeeking = true;
                seekInput.onmouseup = (e) => {
                    isSeeking = false;
                    if(audioEl.duration) {
                        audioEl.currentTime = (e.target.value / 100) * audioEl.duration;
                    }
                };
                
                seekInput.oninput = (e) => {
                    seekFill.style.width = e.target.value + '%';
                };
                
                audioEl.ontimeupdate = () => {
                    if(audioEl.duration && !isSeeking) {
                        const pct = (audioEl.currentTime / audioEl.duration) * 100;
                        seekInput.value = pct;
                        seekFill.style.width = pct + '%';
                    }
                };
            } else {
                waveformContainer.innerHTML = "NO DATA EXTRACTED";
                waveformContainer.style.color = "#444";
            }
        });
        
        // MASTER PLAY ALL BUTTON
        const actionPanel = document.querySelector('.action-panel');
        // Remove existing process button to replace with Play All
        const oldBtn = document.getElementById('process-btn');
        if (oldBtn) oldBtn.style.display = 'none';
        
        const playAllBtn = document.createElement('button');
        playAllBtn.className = "cyber-button";
        playAllBtn.innerHTML = "▶ PLAY ALL STEMS";
        playAllBtn.style.background = "var(--accent-cyan)";
        playAllBtn.style.color = "#000";
        playAllBtn.style.fontWeight = "bold";
        playAllBtn.style.padding = "15px";
        playAllBtn.style.border = "none";
        playAllBtn.style.borderRadius = "8px";
        playAllBtn.style.cursor = "pointer";
        playAllBtn.style.boxShadow = "0 0 20px rgba(0, 243, 255, 0.5)";
        playAllBtn.style.marginTop = "20px";
        playAllBtn.style.width = "100%";
        playAllBtn.style.textShadow = "none";
        playAllBtn.style.fontSize = "1rem";
        playAllBtn.style.letterSpacing = "2px";
        
        let allPlaying = false;
        playAllBtn.addEventListener('click', () => {
            const players = Object.values(trackPlayers);
            if (!allPlaying) {
                players.forEach(p => p.play());
                playAllBtn.innerHTML = "⏸ PAUSE ALL";
                allPlaying = true;
                document.querySelectorAll('.track-waveform button:first-child').forEach(b => {
                    b.innerHTML = "⏸";
                });
            } else {
                players.forEach(p => p.pause());
                playAllBtn.innerHTML = "▶ PLAY ALL STEMS";
                allPlaying = false;
                document.querySelectorAll('.track-waveform button:first-child').forEach(b => {
                    b.innerHTML = "▶";
                });
            }
        });
        
        
        actionPanel.appendChild(playAllBtn);
        
        if (hasStems && downloadAllBtn) {
            const headerMarquee = document.querySelector('.track-header h3');
            if(headerMarquee) {
                headerMarquee.innerHTML = "*** NEURAL STEM SEPARATION V1.0 *** EXTRACTION COMPLETE *** *** NEURAL STEM SEPARATION V1.0 *** EXTRACTION COMPLETE *** ";
            }
            const statusIndicator = document.querySelector('.status-indicator');
            if (statusIndicator) {
                statusIndicator.innerHTML = "ONLINE";
                statusIndicator.style.color = "var(--accent-cyan)";
                statusIndicator.style.borderColor = "var(--accent-cyan)";
                statusIndicator.style.boxShadow = "0 0 5px var(--accent-cyan)";
            }
            
            downloadAllBtn.style.opacity = '1';
            downloadAllBtn.style.cursor = 'pointer';
            downloadAllBtn.style.borderColor = 'var(--accent-cyan)';
            downloadAllBtn.style.color = 'var(--accent-cyan)';
            downloadAllBtn.style.background = 'rgba(0,243,255,0.1)';
            
            downloadAllBtn.addEventListener('click', async () => {
                const trackNames = ['vocals', 'drums', 'bass', 'melody', 'beat'];
                const keys = Object.keys(stems);
                
                // Change button state
                const originalText = downloadAllBtn.innerHTML;
                downloadAllBtn.innerHTML = "PACKAGING ZIP...";
                downloadAllBtn.style.opacity = "0.5";
                downloadAllBtn.style.pointerEvents = "none";
                
                try {
                    const zip = new JSZip();
                    
                    for (const track of trackNames) {
                        let url = null;
                        if (track === 'beat') {
                            const beatKey = keys.find(k => k.toLowerCase().includes("instrumental"));
                            if (beatKey) url = stems[beatKey];
                        } else if (track === 'melody') {
                            const melodyKey = keys.find(k => k.toLowerCase().includes("other"));
                            if (melodyKey) url = stems[melodyKey];
                        } else {
                            const directKey = keys.find(k => k.toLowerCase().includes(track));
                            if (directKey) url = stems[directKey];
                        }
                        
                        if (url) {
                            // Fetch the file as blob
                            const response = await fetch(url);
                            const blob = await response.blob();
                            zip.file(`FUSE_VOID_${track.toUpperCase()}_STEM.wav`, blob);
                        }
                    }
                    
                    // Generate zip
                    const zipBlob = await zip.generateAsync({ type: "blob" });
                    const zipUrl = URL.createObjectURL(zipBlob);
                    
                    // Download the zip
                    const a = document.createElement('a');
                    a.href = zipUrl;
                    a.download = "FUSE_VOID_STEMS.zip";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    URL.revokeObjectURL(zipUrl);
                    
                } catch (e) {
                    console.error("Zip error:", e);
                    alert("ZIP Packaging failed: " + e.message);
                } finally {
                    downloadAllBtn.innerHTML = originalText;
                    downloadAllBtn.style.opacity = "1";
                    downloadAllBtn.style.pointerEvents = "auto";
                }
            });
            
            // Ensure download all button is placed after play all button
            actionPanel.appendChild(downloadAllBtn);
        }
    }
});


// --- LEMON SQUEEZY CHECKOUT LOGIC ---
window.checkout = async function(variantId) {
    const euWaiverSub = document.getElementById('eu-withdrawal-waiver-sub');
    if (euWaiverSub && !euWaiverSub.checked) {
        showSysMsg("YOU MUST AGREE TO THE WITHDRAWAL WAIVER TO PROCEED.");
        euWaiverSub.parentElement.style.color = "#ff0032";
        setTimeout(() => { if(euWaiverSub.parentElement) euWaiverSub.parentElement.style.color = "#888"; }, 1500);
        return;
    }

    if (!authToken) {
        document.getElementById('pricing-modal').style.display = 'none';
        document.getElementById('auth-modal').style.display = 'flex';
        return;
    }
    
    try {
        showSysMsg("ESTABLISHING SECURE COMMERCE UPLINK...");
        const response = await fetch(API_URL + "/api/checkout-url", {
            method: "POST",
            headers: { 
                "Authorization": "Bearer " + authToken,
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ variant_id: variantId })
        });
        
        const data = await response.json();
        if (data.success && data.url) {
            window.location.href = data.url; // Redirect to Lemon Squeezy Checkout
        } else {
            showSysMsg("COMMERCE UPLINK FAILED: " + (data.error || "Unknown Error"));
        }
    } catch (err) {
        console.error(err);
        showSysMsg("SYSTEM ERROR: UNABLE TO REACH COMMERCE ENDPOINT.");
    }
};


// Wire up Add Credits Button
document.addEventListener('DOMContentLoaded', () => {
    const addCreditsBtn = document.getElementById('add-credits-btn-top');
    const pricingModal = document.getElementById('pricing-modal');
    
    if (addCreditsBtn && pricingModal) {
        addCreditsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            pricingModal.style.display = 'flex';
        });
    }
    
    // Also wire it directly just in case it's added dynamically later
    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'add-credits-btn-top') {
            e.preventDefault();
            e.stopPropagation();
            const modal = document.getElementById('pricing-modal');
            if(modal) modal.style.display = 'flex';
        }
    });
});
