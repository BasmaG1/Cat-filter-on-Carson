// COMPUTER VISION TEMPLATE

// This template provides two ml5 wrapped mediapipe models:
// 1. Face Mesh: 478 landmarks for face
// 2. Hand Pose: 21 landmarks per hand 

// SETUP CANVAS

let canvas;
let video;
let canvasWidth, canvasHeight;

// Dynamic sizing - canvas will be 85% of window size
const CANVAS_SCALE = 0.85;

// SETUP MODELS

// ML5 Models
let faceMesh;
let handPose;

// ML5 Results - These arrays contain all the landmark data!
let faces = [];
let hands = [];

// Toggle States
let showFace = false;  // Off by default
let showHands = false; // Off by default
let showVideo = true;  // Video on by default
let showDataStream = false; // Data stream off by default
let showDataOnVisualization = false; // Data on visualization off by default

// Trigger states
let winkTriggerEnabled = false;
let mouthTextTriggerEnabled = false;
let wristCircleTriggerEnabled = false;
let fireBreathEnabled = false; // Fire breath when mouth opens
let catEyeTriggerEnabled = false; // Cat appears when eye closes
let mouthWowTriggerEnabled = false; // "WOW" text when mouth opens
let catEarsEnabled = false; // Cat ears on head
let eyelashesEnabled = false; // Cartoon eyelashes on eyes
let whiskersEnabled = false; // Black whiskers on cheeks
let redLipsEnabled = false; // Red lips that track mouth movement

// Mouth text stream variables
// NOTE FOR USERS: Change this quote to whatever text you want to display
let criticalTheoryQuote = "The apparatus of surveillance has become so normalized that we perform for invisible audiences, transforming every gesture into data, every glance into currency for algorithmic interpretation.";
let quoteWords = [];
let currentWordIndex = 0;
let lastMouthState = false;
let wordDisplayTime = 200; // milliseconds per word

// Data stream options
let dataStreamOptions = {
    mouthOpen: false,
    leftEyeOpen: false,
    rightEyeOpen: false,
    noseCenter: false,
    wristPosition: false,
    handOpen: false,
    fingertipPositions: false
};

// BASIC VISUAL SETTINGS - CUSTOMIZE THESE!

// Colors for different detections
const COLORS = {
    face: '#00FF00',      // Bright green for face mesh
    hands: '#FF0066'      // Hot pink for hands
};

// Drawing settings
let pointSize = 5;  // Consistent size for all landmarks
let lineThickness = 2;

// Cat image for eye trigger
let catImage;

// Fire breath system
let fireParticles = [];
let maxFireParticles = 150;
let fireSpawnRate = 8; // Fire particles per frame

// P5.JS SETUP FUNCTION - DON'T CHANGE THIS, THIS SETS UP OUR CANVAS AND COMPUTER VISION TOOLSET

function setup() {
    // Calculate dynamic canvas size
    calculateCanvasSize();
    
    // Create canvas with dynamic sizing
    canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('p5-container');
    
    // Load cat image
    catImage = loadImage('https://placekitten.com/200/200', () => {
        console.log("Cat image loaded successfully");
    }, () => {
        console.log("Failed to load cat image, using fallback");
        // Create a simple cat shape as fallback
        catImage = createGraphics(200, 200);
        catImage.background(255);
        catImage.fill(255, 165, 0); // Orange
        catImage.ellipse(100, 100, 150, 120); // Cat face
        catImage.fill(0);
        catImage.ellipse(80, 80, 15, 15); // Left eye
        catImage.ellipse(120, 80, 15, 15); // Right eye
        catImage.triangle(100, 110, 90, 130, 110, 130); // Nose
        catImage.triangle(70, 60, 60, 80, 80, 80); // Left ear
        catImage.triangle(130, 60, 120, 80, 140, 80); // Right ear
    });
    
    // Set up UI controls
    setupControls();
    
    updateStatus("🚀 Initializing camera...");
    
    // Initialize video capture first
    initializeVideo();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
}

function initializeVideo() {
    // Initialize video capture
    video = createCapture(VIDEO, () => {
        video.size(canvasWidth, canvasHeight);
        video.hide(); // Hide the default video element
    
        updateStatus("📹 Camera ready, checking ML5...");
        console.log("Video ready, checking ML5...");
        console.log("typeof ml5:", typeof ml5);
        console.log("window.ml5:", window.ml5);
        
        // Check for ML5 availability with more thorough detection
        function checkML5() {
            if (typeof ml5 !== 'undefined' && ml5.version) {
                console.log("✅ ML5 found! Version:", ml5.version);
                updateStatus("🤖 ML5 detected, loading models...");
                initializeML5Models();
            } else {
                console.log("❌ ML5 not found, retrying...");
                return false;
            }
            return true;
        }
        
        // Try immediately
        if (!checkML5()) {
            updateStatus("⏳ Waiting for ML5 to load...");
            
            // Try every 500ms for up to 10 seconds
            let attempts = 0;
            const maxAttempts = 20;
            
            const checkInterval = setInterval(() => {
                attempts++;
                console.log(`Attempt ${attempts}/${maxAttempts} to find ML5`);
                
                if (checkML5()) {
                    clearInterval(checkInterval);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    updateStatus("❌ ML5 failed to load. Try refreshing the page.");
                    console.error("ML5 failed to load after", maxAttempts, "attempts");
}
            }, 500);
        }
    });
}

// P5.JS DRAW FUNCTION - MAIN ANIMATION LOOP

function draw() {
    // Clear background
    background(0);
    
    // Only draw video if it's loaded and ready AND showVideo is enabled
    if (showVideo && video && video.loadedmetadata) {
        // Draw video feed (mirrored for natural webcam feel)
        push();
        translate(width, 0);
        scale(-1, 1);
        tint(255, 200); // Slightly transparent video
        image(video, 0, 0, width, height);
        noTint();
        pop();
    } else if (!video || !video.loadedmetadata) {
        // Show loading indicator only if video isn't ready
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(24);
        text("Loading camera...", width/2, height/2);
    }
    
    // Draw all ML5 detections with extra debugging
    if (showFace) {
        console.log("Attempting to draw faces, count:", faces ? faces.length : 0);
        drawFaceMesh();
    }
    if (showHands) {
        console.log("Attempting to draw hands, count:", hands ? hands.length : 0);
        drawHands();
    }
    
    // Draw data stream in right panel if enabled
    if (showDataStream) {
        updateDataStreamPanel();
    }
    
    // Draw data labels on visualization if enabled
    if (showDataOnVisualization) {
        drawDataOnVisualization();
    }
    
    // Draw trigger effects
    if (winkTriggerEnabled) {
        drawWinkEffect();
    }
    
    if (mouthTextTriggerEnabled) {
        drawMouthTextEffect();
    }
    
    if (wristCircleTriggerEnabled) {
        drawWristCircleEffect();
    }
    
    if (fireBreathEnabled) {
        updateFireBreath();
        drawFireBreath();
    }
    
    if (catEyeTriggerEnabled) {
        drawCatEyeEffect();
    }
    
    if (mouthWowTriggerEnabled) {
        drawMouthWowEffect();
    }
    
    if (catEarsEnabled) {
        drawCatEars();
    }
    
    if (eyelashesEnabled) {
        drawEyelashes();
    }
    
    if (whiskersEnabled) {
        drawWhiskers();
    }
    
    if (redLipsEnabled) {
        drawRedLips();
    }
    
    // Update detection counts
    updateDetectionCounts();



}

// CANVAS SIZING AND RESPONSIVENESS

function calculateCanvasSize() {
    // Calculate canvas size based on window dimensions
    let maxWidth = windowWidth * CANVAS_SCALE;
    let maxHeight = windowHeight * CANVAS_SCALE;
    
    // Maintain 4:3 aspect ratio for video compatibility
    let aspectRatio = 4/3;
    
    if (maxWidth / aspectRatio <= maxHeight) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth / aspectRatio;
    } else {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * aspectRatio;
    }
    
    // Ensure minimum size for usability
    canvasWidth = max(canvasWidth, 480);
    canvasHeight = max(canvasHeight, 360);
}

function handleResize() {
    calculateCanvasSize();
    resizeCanvas(canvasWidth, canvasHeight);
    if (video && video.elt) {
        video.size(canvasWidth, canvasHeight);
    }
}

// ML5 MODEL INITIALIZATION

function initializeML5Models() {
    console.log("🚀 Starting ML5 model initialization...");
    updateStatus("🤖 Loading Face Mesh...");
    
    let modelsLoaded = 0;
    const totalModels = 2;
    
    function checkAllModelsLoaded() {
        modelsLoaded++;
        console.log(`✅ Model ${modelsLoaded}/${totalModels} loaded`);
        if (modelsLoaded >= totalModels) {
            updateStatus("🎯 All models ready! Starting predictions...");
            startPredictionLoop();
        }
    }
    
    try {
        // Initialize Face Mesh - v1.2.1 API
        console.log("Initializing Face Mesh...");
        faceMesh = ml5.faceMesh(video, {
            maxFaces: 1,  // Realistic limit - most models optimized for 1 face
            refineLandmarks: true,
            flipHorizontal: true
        }, () => {
            console.log("✅ Face Mesh ready!");
            updateStatus("🤖 Loading Hand Pose...");
            checkAllModelsLoaded();
        });
        
        // Initialize Hand Pose - v1.2.1 API
        console.log("Initializing Hand Pose...");
        handPose = ml5.handPose(video, {
            maxHands: 2,  // Realistic limit - typically 2 hands per person
            flipHorizontal: true
        }, () => {
            console.log("✅ Hand Pose ready!");
            checkAllModelsLoaded();
        });
        
        // Fallback: Start prediction loop after 5 seconds even if not all models load
        setTimeout(() => {
            if (modelsLoaded < totalModels) {
                console.log("⚠️ Not all models loaded, starting anyway...");
                updateStatus("⚠️ Some models failed, starting with available ones...");
                startPredictionLoop();
            }
        }, 5000);
        
    } catch (error) {
        console.error("Error initializing ML5 models:", error);
        updateStatus("❌ Error loading ML5 models. Try refreshing page.");
    }
}

// Correct prediction approach for ML5 v1.2.1
function startPredictionLoop() {
    console.log("🔄 Starting prediction loop with detectMedia...");
    
    // First, let's inspect what's actually available
    function inspectModels() {
        console.log("=== MODEL INSPECTION ===");
        
        if (faceMesh) {
            console.log("FaceMesh object:", faceMesh);
            console.log("FaceMesh.detectMedia type:", typeof faceMesh.detectMedia);
            console.log("FaceMesh.detect type:", typeof faceMesh.detect);
            console.log("FaceMesh.predict type:", typeof faceMesh.predict);
            console.log("FaceMesh.ready:", faceMesh.ready);
        }
        
        if (handPose) {
            console.log("HandPose object:", handPose);
            console.log("HandPose.detectMedia type:", typeof handPose.detectMedia);
            console.log("HandPose.detect type:", typeof handPose.detect);
            console.log("HandPose.predict type:", typeof handPose.predict);
            console.log("HandPose.ready:", handPose.ready);
        }
        
        console.log("Video element:", video);
        console.log("Video.elt:", video.elt);
        console.log("=== END INSPECTION ===");
    }
    
    function runDetections() {
        console.log("🔄 Running detection cycle...");
        
        // Inspect models first time
        if (!runDetections.inspected) {
            inspectModels();
            runDetections.inspected = true;
        }
        
        // Try multiple detection methods for Face Mesh
        if (faceMesh) {
            console.log("Trying face detection...");
            
            // Method 1: detectMedia
            if (typeof faceMesh.detectMedia === 'function' && video.elt) {
                console.log("Trying detectMedia...");
                try {
                    faceMesh.detectMedia(video.elt, (results) => {
                        console.log("Face detectMedia callback:", results);
                        if (results && results.length > 0) {
                            faces = results;
                            console.log("✅ Face results via detectMedia:", results.length);
                        }
                    });
                } catch (error) {
                    console.error("Face detectMedia error:", error);
                }
            }
            
            // Method 2: detect
            else if (typeof faceMesh.detect === 'function' && video.elt) {
                console.log("Trying detect...");
                try {
                    faceMesh.detect(video.elt, (results) => {
                        console.log("Face detect callback:", results);
                        if (results && results.length > 0) {
                            faces = results;
                            console.log("✅ Face results via detect:", results.length);
                        }
                    });
                } catch (error) {
                    console.error("Face detect error:", error);
                }
            }
            
            // Method 3: predict
            else if (typeof faceMesh.predict === 'function' && video.elt) {
                console.log("Trying predict...");
                try {
                    faceMesh.predict(video.elt, (results) => {
                        console.log("Face predict callback:", results);
                        if (results && results.length > 0) {
                            faces = results;
                            console.log("✅ Face results via predict:", results.length);
                        }
                    });
                } catch (error) {
                    console.error("Face predict error:", error);
                }
            }
            
            else {
                console.log("No working face detection method found");
            }
        }
        
        // Try multiple detection methods for Hand Pose
        if (handPose) {
            console.log("Trying hand detection...");
            
            if (typeof handPose.detectMedia === 'function' && video.elt) {
                try {
                    handPose.detectMedia(video.elt, (results) => {
                        if (results && results.length > 0) {
                            hands = results;
                            console.log("✅ Hand results via detectMedia:", results.length);
                        }
                    });
                } catch (error) {
                    console.error("Hand detectMedia error:", error);
                }
            }
            else if (typeof handPose.detect === 'function' && video.elt) {
                try {
                    handPose.detect(video.elt, (results) => {
                        if (results && results.length > 0) {
                            hands = results;
                            console.log("✅ Hand results via detect:", results.length);
                        }
                    });
                } catch (error) {
                    console.error("Hand detect error:", error);
                }
            }
            else if (typeof handPose.predict === 'function' && video.elt) {
                try {
                    handPose.predict(video.elt, (results) => {
                        if (results && results.length > 0) {
                            hands = results;
                            console.log("✅ Hand results via predict:", results.length);
                        }
                    });
                } catch (error) {
                    console.error("Hand predict error:", error);
                }
            }
            else {
                console.log("No working hand detection method found");
            }
        }
        
        // Continue the loop after a delay
        setTimeout(runDetections, 100); // Much faster - 10 FPS detection
    }
    
    // Add a small delay before starting to ensure video is ready
    setTimeout(() => {
        console.log("🎬 Starting detection loop...");
        runDetections();
    }, 2000);
}

// ML5 DRAWING FUNCTIONS

function drawFaceMesh() {
    if (!faces || faces.length === 0) return;
    
    console.log("Drawing", faces.length, "faces, structure:", faces[0]);
    
    // Set drawing style
    fill(255, 0, 0); // Bright red so it's obvious
    noStroke();
    
    for (let face of faces) {
        console.log("Face object keys:", Object.keys(face));
        
        // Try different possible keypoint locations
        let keypoints = face.keypoints || face.landmarks || face.points || face.vertices;
        
        if (keypoints && keypoints.length > 0) {
            console.log("Found keypoints:", keypoints.length, "first point:", keypoints[0]);
            
            // Draw all keypoints as bright red dots
            for (let point of keypoints) {
                let x, y;
                
                // Handle different data structures - ML5 already handles flipping
                if (point.x !== undefined && point.y !== undefined) {
                    x = point.x; // ML5 flipHorizontal: true already flipped these
                    y = point.y;
                } else if (Array.isArray(point) && point.length >= 2) {
                    x = point[0]; // ML5 flipHorizontal: true already flipped these
                    y = point[1];
                } else {
                    continue; // Skip this point if we can't understand it
                }
                
                // Draw consistent sized dots for face landmarks
                ellipse(x, y, pointSize, pointSize);
            }
        } else {
            console.log("No keypoints found in face object");
        }
    }
}

function drawHands() {
    if (!hands || hands.length === 0) return;
    
    console.log("Drawing", hands.length, "hands");
    
    for (let hand of hands) {
        if (hand.keypoints && hand.keypoints.length > 0) {
            console.log("Hand has", hand.keypoints.length, "keypoints");
            
            // Draw hand landmarks
            fill(COLORS.hands);
            noStroke();
            
            for (let keypoint of hand.keypoints) {
                let x = keypoint.x; // ML5 flipHorizontal: true already flipped these
                let y = keypoint.y;
                
                // Draw consistent sized dots for hand landmarks
                ellipse(x, y, pointSize, pointSize);
            }
            
            // Draw hand connections
            stroke(COLORS.hands);
            strokeWeight(lineThickness);
            drawHandConnections(hand.keypoints);
            
            // Draw hand label
            if (hand.keypoints[0]) {
                fill(COLORS.hands);
                noStroke();
                textAlign(CENTER);
                textSize(12);
                text(hand.label || "Hand", 
                     hand.keypoints[0].x, 
                     hand.keypoints[0].y - 20);
            }
        }
    }
}

// DATA STREAM FUNCTIONS

function updateDataStreamPanel() {
    let contentHtml = '';
    
    // Extract and display data based on enabled options
    if (dataStreamOptions.mouthOpen) {
        let mouthOpen = isMouthOpen();
        contentHtml += `<div class="data-item"><strong>Mouth Open:</strong> ${mouthOpen}</div>`;
    }
    
    if (dataStreamOptions.leftEyeOpen) {
        let leftEyeOpen = isLeftEyeOpen();
        contentHtml += `<div class="data-item"><strong>Left Eye Open:</strong> ${leftEyeOpen}</div>`;
    }
    
    if (dataStreamOptions.rightEyeOpen) {
        let rightEyeOpen = isRightEyeOpen();
        contentHtml += `<div class="data-item"><strong>Right Eye Open:</strong> ${rightEyeOpen}</div>`;
    }
    
    if (dataStreamOptions.noseCenter) {
        let nosePos = getNoseCenter();
        if (nosePos) {
            contentHtml += `<div class="data-item"><strong>Nose Center:</strong> (${nosePos.x.toFixed(1)}, ${nosePos.y.toFixed(1)})</div>`;
        } else {
            contentHtml += `<div class="data-item"><strong>Nose Center:</strong> Not detected</div>`;
        }
    }
    
    if (dataStreamOptions.wristPosition) {
        let wrists = getWristPositions();
        for (let i = 0; i < wrists.length; i++) {
            if (wrists[i]) {
                contentHtml += `<div class="data-item"><strong>Wrist ${i + 1}:</strong> (${wrists[i].x.toFixed(1)}, ${wrists[i].y.toFixed(1)})</div>`;
            } else {
                contentHtml += `<div class="data-item"><strong>Wrist ${i + 1}:</strong> Not detected</div>`;
            }
        }
    }
    
    if (dataStreamOptions.handOpen) {
        let handsOpen = getHandsOpenStatus();
        for (let i = 0; i < handsOpen.length; i++) {
            contentHtml += `<div class="data-item"><strong>Hand ${i + 1} Open:</strong> ${handsOpen[i]}</div>`;
        }
    }
    
    if (dataStreamOptions.fingertipPositions) {
        let fingertips = getAllFingertipPositions();
        for (let handIndex = 0; handIndex < fingertips.length; handIndex++) {
            let handTips = fingertips[handIndex];
            if (handTips) {
                contentHtml += `<div class="data-section"><strong>Hand ${handIndex + 1} Fingertips:</strong></div>`;
                const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
                for (let i = 0; i < handTips.length; i++) {
                    if (handTips[i]) {
                        contentHtml += `<div class="data-subitem">${fingerNames[i]}: (${handTips[i].x.toFixed(1)}, ${handTips[i].y.toFixed(1)})</div>`;
                    }
                }
            }
        }
    }
    
    // Update the HTML content
    document.getElementById('dataStreamContent').innerHTML = contentHtml || '<div class="data-item">No data options selected</div>';
}

function drawDataOnVisualization() {
    // Set text style for visualization labels
    textAlign(LEFT);
    textSize(11);
    fill(255, 255, 0); // Yellow text for visibility
    stroke(0);
    strokeWeight(1);
    
    // Draw mouth status near mouth area
    if (dataStreamOptions.mouthOpen) {
        if (faces.length > 0 && faces[0].keypoints && faces[0].keypoints.length > 14) {
            let face = faces[0];
            let mouthOpen = isMouthOpen();
            let mouthPos = face.keypoints[14]; // Lower lip area
            if (mouthPos) {
                text(`Mouth: ${mouthOpen ? "Open" : "Closed"}`, mouthPos.x + 10, mouthPos.y + 20);
            }
        }
    }
    
    // Draw left eye status near left eye
    if (dataStreamOptions.leftEyeOpen) {
        if (faces.length > 0 && faces[0].keypoints && faces[0].keypoints.length > 133) {
            let face = faces[0];
            let leftEyeOpen = isLeftEyeOpen();
            let leftEyePos = face.keypoints[133]; // Left eye center (subject's left = viewer's right)
            if (leftEyePos) {
                text(`L Eye: ${leftEyeOpen ? "Open" : "Closed"}`, leftEyePos.x + 15, leftEyePos.y - 10);
            }
        }
    }
    
    // Draw right eye status near right eye
    if (dataStreamOptions.rightEyeOpen) {
        if (faces.length > 0 && faces[0].keypoints && faces[0].keypoints.length > 362) {
            let face = faces[0];
            let rightEyeOpen = isRightEyeOpen();
            let rightEyePos = face.keypoints[362]; // Right eye center (subject's right = viewer's left)
            if (rightEyePos) {
                text(`R Eye: ${rightEyeOpen ? "Open" : "Closed"}`, rightEyePos.x - 60, rightEyePos.y - 10);
            }
        }
    }
    
    // Draw nose coordinates near nose
    if (dataStreamOptions.noseCenter) {
        let nosePos = getNoseCenter();
        if (nosePos) {
            text(`(${nosePos.x.toFixed(0)}, ${nosePos.y.toFixed(0)})`, nosePos.x + 10, nosePos.y - 10);
        }
    }
    
    // Draw wrist coordinates near each wrist
    if (dataStreamOptions.wristPosition) {
        let wrists = getWristPositions();
        for (let i = 0; i < wrists.length; i++) {
            if (wrists[i]) {
                text(`W${i + 1}: (${wrists[i].x.toFixed(0)}, ${wrists[i].y.toFixed(0)})`, 
                     wrists[i].x + 10, wrists[i].y - 10);
            }
        }
    }
    
    // Draw hand open/closed status near palm
    if (dataStreamOptions.handOpen) {
        let handsOpen = getHandsOpenStatus();
        for (let i = 0; i < hands.length; i++) {
            if (hands[i] && hands[i].keypoints && hands[i].keypoints[9]) { // Middle finger base (palm area)
                let palmPos = hands[i].keypoints[9];
                text(`${handsOpen[i] ? "Open" : "Closed"}`, palmPos.x + 10, palmPos.y + 20);
            }
        }
    }
    
    // Draw fingertip coordinates near each fingertip
    if (dataStreamOptions.fingertipPositions) {
        let fingertips = getAllFingertipPositions();
        const fingerNames = ['T', 'I', 'M', 'R', 'P']; // Abbreviated names
        for (let handIndex = 0; handIndex < fingertips.length; handIndex++) {
            let handTips = fingertips[handIndex];
            if (handTips) {
                for (let i = 0; i < handTips.length; i++) {
                    if (handTips[i]) {
                        text(`${fingerNames[i]}:(${handTips[i].x.toFixed(0)},${handTips[i].y.toFixed(0)})`, 
                             handTips[i].x + 8, handTips[i].y - 8);
                    }
                }
            }
        }
    }
    
    noStroke(); // Reset stroke
}

// TRIGGER EFFECT FUNCTIONS

function drawWinkEffect() {
    // Check if exactly one eye is closed
    let leftEyeOpen = isLeftEyeOpen();
    let rightEyeOpen = isRightEyeOpen();
    
    if ((leftEyeOpen && !rightEyeOpen) || (!leftEyeOpen && rightEyeOpen)) {
        // Draw WINK text in cute pink
        push();
        fill(255, 20, 147); // Deep pink
        textAlign(CENTER, CENTER);
        textSize(72);
        textStyle(BOLD);
        
        // Add some fun styling
        stroke(255);
        strokeWeight(3);
        
        text("WINK", width / 2, height / 2);
        pop();
    }
}

function drawMouthTextEffect() {
    let mouthOpen = isMouthOpen();
    
    // Reset when mouth closes
    if (!mouthOpen && lastMouthState) {
        currentWordIndex = 0;
    }
    
    lastMouthState = mouthOpen;
    
    if (mouthOpen && quoteWords.length > 0) {
        // Display words progressively
        let wordsToShow = Math.floor((millis() % (quoteWords.length * wordDisplayTime)) / wordDisplayTime);
        wordsToShow = Math.min(wordsToShow, quoteWords.length - 1);
        
        let textToDisplay = quoteWords.slice(0, wordsToShow + 1).join(' ');
        
        if (textToDisplay) {
            push();
            fill(255, 255, 0); // Yellow text
            stroke(0);
            strokeWeight(2);
            textAlign(CENTER, TOP);
            textSize(24);
            textStyle(NORMAL);
            
            // Word wrap for long text
            let lines = textToDisplay.split(' ');
            let currentLine = '';
            let lineHeight = 30;
            let yPos = 50;
            
            for (let word of lines) {
                let testLine = currentLine + word + ' ';
                if (textWidth(testLine) > width - 40 && currentLine.length > 0) {
                    text(currentLine, width / 2, yPos);
                    currentLine = word + ' ';
                    yPos += lineHeight;
                } else {
                    currentLine = testLine;
                }
            }
            
            if (currentLine.length > 0) {
                text(currentLine, width / 2, yPos);
            }
            
            pop();
        }
    }
}

function drawWristCircleEffect() {
    let wrists = getWristPositions();
    
    if (wrists.length >= 2 && wrists[0] && wrists[1]) {
        // Calculate center point between wrists
        let centerX = (wrists[0].x + wrists[1].x) / 2;
        let centerY = (wrists[0].y + wrists[1].y) / 2;
        
        // Calculate distance between wrists
        let distance = getLandmarkDistance(wrists[0], wrists[1]);
        
        // Map distance to circle size (adjust these values as needed)
        let circleSize = map(distance, 50, 400, 20, 200);
        circleSize = constrain(circleSize, 20, 200);
        
        // Draw white circle with no stroke
        push();
        fill(255);
        noStroke();
        ellipse(centerX, centerY, circleSize, circleSize);
        pop();
    }
}

function drawMouthWowEffect() {
    let mouthOpen = isMouthOpen();
    
    if (mouthOpen) {
        // Draw "WOW" text in navy blue
        push();
        fill(0, 0, 128); // Navy blue color
        textAlign(LEFT, TOP);
        textSize(30);
        textStyle(BOLD);
        noStroke();
        
        // Position on the left side of the screen
        text("WOW", 20, 20);
        pop();
    }
}

function drawCatEyeEffect() {
    let leftEyeOpen = isLeftEyeOpen();
    let rightEyeOpen = isRightEyeOpen();
    
    // Check if exactly one eye is closed (winking)
    if ((leftEyeOpen && !rightEyeOpen) || (!leftEyeOpen && rightEyeOpen)) {
        if (catImage) {
            // Draw cat image next to the "WOW" text
            push();
            imageMode(CORNER);
            // Position cat image to the right of "WOW" text
            image(catImage, 120, 20, 100, 100); // 100x100 size, positioned at (120, 20)
            
            // Add a fun caption
            fill(255, 20, 147); // Hot pink
            textAlign(LEFT, TOP);
            textSize(16);
            textStyle(BOLD);
            text("Meow! 😸", 120, 130);
            pop();
        }
    }
}

// FIRE BREATH FUNCTIONS

function updateFireBreath() {
    let mouthOpen = isMouthOpen();
    
    if (mouthOpen && faces.length > 0) {
        // Get mouth position from face landmarks
        let face = faces[0];
        if (face.keypoints && face.keypoints.length >= 14) {
            let mouthCenter = face.keypoints[14]; // Lower lip center
            if (mouthCenter) {
                // Spawn fire particles from mouth
                for (let i = 0; i < fireSpawnRate; i++) {
                    if (fireParticles.length < maxFireParticles) {
                        // Add some randomness around mouth position
                        let spawnX = mouthCenter.x + random(-15, 15);
                        let spawnY = mouthCenter.y + random(-10, 10);
                        
                        fireParticles.push(new FireParticle(spawnX, spawnY));
                    }
                }
            }
        }
    }
    
    // Update all fire particles
    for (let i = fireParticles.length - 1; i >= 0; i--) {
        fireParticles[i].update();
        
        // Remove dead particles
        if (fireParticles[i].isDead()) {
            fireParticles.splice(i, 1);
        }
    }
}

function drawFireBreath() {
    // Draw all fire particles
    for (let particle of fireParticles) {
        particle.draw();
    }
}

function clearFireBreath() {
    fireParticles = [];
}

function drawCatEars() {
    if (faces.length === 0 || !faces[0].keypoints) return;
    
    let face = faces[0];
    // Use forehead landmarks for ear positioning
    // Face mesh landmarks around the top of the head
    let leftEarBase = face.keypoints[10]; // Left side of forehead
    let rightEarBase = face.keypoints[338]; // Right side of forehead
    let topOfHead = face.keypoints[10]; // Top center of head
    
    if (leftEarBase && rightEarBase && topOfHead) {
        push();
        
        // Cat ear color - pink/peach
        fill(255, 182, 193); // Light pink
        stroke(255, 105, 180); // Hot pink outline
        strokeWeight(2);
        
        // Calculate ear positions
        let earWidth = 20;
        let earHeight = 35;
        let earSpacing = 40; // Distance between ears
        
        // Left ear
        let leftEarX = leftEarBase.x - earSpacing/2;
        let leftEarY = leftEarBase.y - 20; // Slightly above forehead
        
        // Right ear
        let rightEarX = rightEarBase.x + earSpacing/2;
        let rightEarY = rightEarBase.y - 20; // Slightly above forehead
        
        // Draw left ear (triangle)
        triangle(
            leftEarX, leftEarY - earHeight, // Top point
            leftEarX - earWidth/2, leftEarY, // Bottom left
            leftEarX + earWidth/2, leftEarY  // Bottom right
        );
        
        // Draw right ear (triangle)
        triangle(
            rightEarX, rightEarY - earHeight, // Top point
            rightEarX - earWidth/2, rightEarY, // Bottom left
            rightEarX + earWidth/2, rightEarY  // Bottom right
        );
        
        // Add inner ear detail (darker pink)
        fill(255, 105, 180); // Hot pink inner ear
        noStroke();
        
        // Left inner ear
        triangle(
            leftEarX, leftEarY - earHeight + 5, // Top point
            leftEarX - earWidth/3, leftEarY - 5, // Bottom left
            leftEarX + earWidth/3, leftEarY - 5  // Bottom right
        );
        
        // Right inner ear
        triangle(
            rightEarX, rightEarY - earHeight + 5, // Top point
            rightEarX - earWidth/3, rightEarY - 5, // Bottom left
            rightEarX + earWidth/3, rightEarY - 5  // Bottom right
        );
        
        pop();
    }
}

function drawEyelashes() {
    if (faces.length === 0 || !faces[0].keypoints) return;
    
    let face = faces[0];
    
    // Get eye landmarks for positioning
    let leftEyeCenter = face.keypoints[133]; // Left eye center
    let rightEyeCenter = face.keypoints[362]; // Right eye center
    let leftEyeUpper = face.keypoints[159]; // Left eye upper eyelid
    let rightEyeUpper = face.keypoints[386]; // Right eye upper eyelid
    
    if (leftEyeCenter && rightEyeCenter && leftEyeUpper && rightEyeUpper) {
        push();
        
        // Eyelash styling
        stroke(0); // Black eyelashes
        strokeWeight(2);
        noFill();
        
        // Eyelash parameters
        let lashLength = 8;
        let lashCount = 5; // Number of lashes per eye
        let lashSpacing = 6; // Space between lashes
        
        // Draw left eye lashes
        let leftStartX = leftEyeUpper.x - (lashCount * lashSpacing) / 2;
        let leftY = leftEyeUpper.y - 2; // Slightly above upper eyelid
        
        for (let i = 0; i < lashCount; i++) {
            let lashX = leftStartX + (i * lashSpacing);
            
            // Curved eyelash effect
            let curveAngle = map(i, 0, lashCount - 1, -0.3, 0.3); // Curved arrangement
            let endX = lashX + sin(curveAngle) * lashLength;
            let endY = leftY - cos(curveAngle) * lashLength;
            
            // Draw individual lash
            line(lashX, leftY, endX, endY);
        }
        
        // Draw right eye lashes
        let rightStartX = rightEyeUpper.x - (lashCount * lashSpacing) / 2;
        let rightY = rightEyeUpper.y - 2; // Slightly above upper eyelid
        
        for (let i = 0; i < lashCount; i++) {
            let lashX = rightStartX + (i * lashSpacing);
            
            // Curved eyelash effect
            let curveAngle = map(i, 0, lashCount - 1, -0.3, 0.3); // Curved arrangement
            let endX = lashX + sin(curveAngle) * lashLength;
            let endY = rightY - cos(curveAngle) * lashLength;
            
            // Draw individual lash
            line(lashX, rightY, endX, endY);
        }
        
        // Add some extra long lashes for cartoon effect
        strokeWeight(1.5);
        
        // Left eye extra lashes
        let leftExtraX = leftEyeUpper.x;
        let leftExtraY = leftEyeUpper.y - 3;
        line(leftExtraX - 8, leftExtraY, leftExtraX - 8, leftExtraY - 12); // Long outer lash
        line(leftExtraX + 8, leftExtraY, leftExtraX + 8, leftExtraY - 12); // Long inner lash
        
        // Right eye extra lashes
        let rightExtraX = rightEyeUpper.x;
        let rightExtraY = rightEyeUpper.y - 3;
        line(rightExtraX - 8, rightExtraY, rightExtraX - 8, rightExtraY - 12); // Long outer lash
        line(rightExtraX + 8, rightExtraY, rightExtraX + 8, rightExtraY - 12); // Long inner lash
        
        pop();
    }
}

function drawWhiskers() {
    if (faces.length === 0 || !faces[0].keypoints) return;
    
    let face = faces[0];
    
    // Get cheek landmarks for whisker positioning
    let leftCheek = face.keypoints[123]; // Left cheek area
    let rightCheek = face.keypoints[352]; // Right cheek area
    let noseBase = face.keypoints[2]; // Base of nose for reference
    
    if (leftCheek && rightCheek && noseBase) {
        push();
        
        // Whisker styling
        stroke(0); // Black whiskers
        strokeWeight(1.5);
        noFill();
        
        // Whisker parameters
        let whiskerLength = 25;
        let whiskerCount = 4; // Number of whiskers per side
        let whiskerSpacing = 8; // Vertical space between whiskers
        
        // Left side whiskers
        let leftStartX = leftCheek.x - 5; // Slightly to the left of cheek
        let leftStartY = leftCheek.y - (whiskerCount * whiskerSpacing) / 2;
        
        for (let i = 0; i < whiskerCount; i++) {
            let whiskerY = leftStartY + (i * whiskerSpacing);
            
            // Slightly curved whisker pointing outward
            let curveAngle = map(i, 0, whiskerCount - 1, -0.2, 0.2); // Gentle curve
            let endX = leftStartX - cos(curveAngle) * whiskerLength;
            let endY = whiskerY + sin(curveAngle) * whiskerLength;
            
            // Draw individual whisker
            line(leftStartX, whiskerY, endX, endY);
        }
        
        // Right side whiskers
        let rightStartX = rightCheek.x + 5; // Slightly to the right of cheek
        let rightStartY = rightCheek.y - (whiskerCount * whiskerSpacing) / 2;
        
        for (let i = 0; i < whiskerCount; i++) {
            let whiskerY = rightStartY + (i * whiskerSpacing);
            
            // Slightly curved whisker pointing outward
            let curveAngle = map(i, 0, whiskerCount - 1, -0.2, 0.2); // Gentle curve
            let endX = rightStartX + cos(curveAngle) * whiskerLength;
            let endY = whiskerY + sin(curveAngle) * whiskerLength;
            
            // Draw individual whisker
            line(rightStartX, whiskerY, endX, endY);
        }
        
        // Add some shorter whiskers above the main ones
        strokeWeight(1);
        
        // Left side short whiskers
        let leftShortStartX = leftStartX - 2;
        let leftShortStartY = leftStartY - 10;
        
        for (let i = 0; i < 2; i++) {
            let shortWhiskerY = leftShortStartY + (i * 6);
            let shortEndX = leftShortStartX - 15;
            let shortEndY = shortWhiskerY + random(-2, 2);
            line(leftShortStartX, shortWhiskerY, shortEndX, shortEndY);
        }
        
        // Right side short whiskers
        let rightShortStartX = rightStartX + 2;
        let rightShortStartY = rightStartY - 10;
        
        for (let i = 0; i < 2; i++) {
            let shortWhiskerY = rightShortStartY + (i * 6);
            let shortEndX = rightShortStartX + 15;
            let shortEndY = shortWhiskerY + random(-2, 2);
            line(rightShortStartX, shortWhiskerY, shortEndX, shortEndY);
        }
        
        pop();
    }
}

function drawRedLips() {
    if (faces.length === 0 || !faces[0].keypoints) return;
    
    let face = faces[0];
    
    // Get lip landmarks for positioning
    let upperLipCenter = face.keypoints[13]; // Upper lip center
    let lowerLipCenter = face.keypoints[14]; // Lower lip center
    let leftLipCorner = face.keypoints[61]; // Left corner of mouth
    let rightLipCorner = face.keypoints[291]; // Right corner of mouth
    
    if (upperLipCenter && lowerLipCenter && leftLipCorner && rightLipCorner) {
        push();
        
        // Check if mouth is open
        let mouthOpen = isMouthOpen();
        let lipDistance = getLandmarkDistance(upperLipCenter, lowerLipCenter);
        
        // Lip styling
        noStroke();
        
        // Calculate lip dimensions
        let lipWidth = getLandmarkDistance(leftLipCorner, rightLipCorner);
        let lipHeight = lipDistance + 5; // Add some padding
        
        // Red lip color - brighter when mouth is open
        let lipRed = mouthOpen ? 255 : 220; // Brighter red when open
        let lipGreen = mouthOpen ? 20 : 20;
        let lipBlue = mouthOpen ? 20 : 20;
        
        fill(lipRed, lipGreen, lipBlue);
        
        // Draw upper lip (slightly curved)
        let centerX = (leftLipCorner.x + rightLipCorner.x) / 2;
        let centerY = (leftLipCorner.y + rightLipCorner.y) / 2;
        
        // Upper lip
        let upperLipY = centerY - lipHeight / 2;
        ellipse(centerX, upperLipY, lipWidth * 0.8, lipHeight * 0.4);
        
        // Lower lip (larger and more prominent)
        let lowerLipY = centerY + lipHeight / 2;
        ellipse(centerX, lowerLipY, lipWidth * 0.9, lipHeight * 0.6);
        
        // Add lip shine/gloss effect
        fill(255, 255, 255, 100); // Semi-transparent white
        ellipse(centerX - lipWidth * 0.1, upperLipY - lipHeight * 0.1, lipWidth * 0.2, lipHeight * 0.1);
        ellipse(centerX + lipWidth * 0.1, lowerLipY - lipHeight * 0.1, lipWidth * 0.3, lipHeight * 0.15);
        
        // Add lip outline for definition
        stroke(180, 0, 0); // Darker red outline
        strokeWeight(1);
        noFill();
        
        // Upper lip outline
        ellipse(centerX, upperLipY, lipWidth * 0.8, lipHeight * 0.4);
        
        // Lower lip outline
        ellipse(centerX, lowerLipY, lipWidth * 0.9, lipHeight * 0.6);
        
        // Add some sparkle effect when mouth is open
        if (mouthOpen) {
            fill(255, 255, 255, 150);
            noStroke();
            ellipse(centerX + lipWidth * 0.2, upperLipY - lipHeight * 0.2, 3, 3);
            ellipse(centerX - lipWidth * 0.15, lowerLipY + lipHeight * 0.1, 2, 2);
        }
        
        pop();
    }
}

// Data extraction functions
function isMouthOpen() {
    if (faces.length === 0 || !faces[0].keypoints) return false;
    let face = faces[0];
    
    // Face mesh landmarks: upper lip center (13) and lower lip center (14)
    // These are approximate - actual face mesh has 478 points
    if (face.keypoints.length >= 478) {
        let upperLip = face.keypoints[13];
        let lowerLip = face.keypoints[14];
        if (upperLip && lowerLip) {
            let distance = getLandmarkDistance(upperLip, lowerLip);
            return distance > 15; // Threshold for mouth open
        }
    }
    return false;
}

function isLeftEyeOpen() {
    if (faces.length === 0 || !faces[0].keypoints) return false;
    let face = faces[0];
    
    // MediaPipe face mesh left eye landmarks (subject's left = viewer's right)
    if (face.keypoints.length >= 478) {
        let upperEyelid = face.keypoints[159]; // Left eye upper eyelid
        let lowerEyelid = face.keypoints[145]; // Left eye lower eyelid
        if (upperEyelid && lowerEyelid) {
            let distance = getLandmarkDistance(upperEyelid, lowerEyelid);
            return distance > 8; // Threshold for eye open (adjust as needed)
        }
    }
    return true; // Default to open if landmarks not available
}

function isRightEyeOpen() {
    if (faces.length === 0 || !faces[0].keypoints) return false;
    let face = faces[0];
    
    // MediaPipe face mesh right eye landmarks (subject's right = viewer's left)
    if (face.keypoints.length >= 478) {
        let upperEyelid = face.keypoints[386]; // Right eye upper eyelid
        let lowerEyelid = face.keypoints[374]; // Right eye lower eyelid
        if (upperEyelid && lowerEyelid) {
            let distance = getLandmarkDistance(upperEyelid, lowerEyelid);
            return distance > 8; // Threshold for eye open (adjust as needed)
        }
    }
    return true; // Default to open if landmarks not available
}

function getNoseCenter() {
    if (faces.length === 0 || !faces[0].keypoints) return null;
    let face = faces[0];
    
    // Face mesh nose tip is typically around index 1 or 2
    if (face.keypoints.length > 2) {
        return face.keypoints[1]; // Approximate nose tip
    }
    return null;
}

function getWristPositions() {
    let wrists = [];
    for (let hand of hands) {
        if (hand.keypoints && hand.keypoints[0]) {
            wrists.push(hand.keypoints[0]); // Wrist is index 0
        } else {
            wrists.push(null);
        }
    }
    return wrists;
}

function getHandsOpenStatus() {
    let handsOpen = [];
    for (let hand of hands) {
        handsOpen.push(!isHandFist(hand)); // Inverse of fist detection
    }
    return handsOpen;
}

function getAllFingertipPositions() {
    let allFingertips = [];
    for (let hand of hands) {
        if (hand.keypoints) {
            let fingertips = [
                hand.keypoints[4],  // Thumb tip
                hand.keypoints[8],  // Index finger tip
                hand.keypoints[12], // Middle finger tip
                hand.keypoints[16], // Ring finger tip
                hand.keypoints[20]  // Pinky tip
            ];
            allFingertips.push(fingertips);
        } else {
            allFingertips.push(null);
        }
    }
    return allFingertips;
}


// CONNECTION DRAWING HELPERS

function drawHandConnections(keypoints) {
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],     // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8],     // Index finger
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [5, 9], [9, 13], [13, 17]           // Palm connections
    ];
    
    for (let connection of connections) {
        let a = keypoints[connection[0]];
        let b = keypoints[connection[1]];
        if (a && b) {
            line(a.x, a.y, b.x, b.y);
        }
    }
}

// USER INTERFACE AND CONTROLS

function setupControls() {
    // Helper function to safely add event listeners
    function addEventListenerSafe(elementId, event, callback) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, callback);
        } else {
            console.warn(`Element with id '${elementId}' not found`);
        }
    }
    
    // Video and detection toggles
    addEventListenerSafe('videoToggle', 'change', function() {
        showVideo = this.checked;
    });
    
    addEventListenerSafe('faceToggle', 'change', function() {
        showFace = this.checked;
    });
    
    addEventListenerSafe('handToggle', 'change', function() {
        showHands = this.checked;
    });
    
    // Data stream toggle
    addEventListenerSafe('dataStreamToggle', 'change', function() {
        showDataStream = this.checked;
        let dataOptions = document.getElementById('dataOptions');
        let dataPanel = document.getElementById('dataPanel');
        if (dataOptions) dataOptions.style.display = this.checked ? 'block' : 'none';
        if (dataPanel) dataPanel.style.display = this.checked ? 'block' : 'none';
    });
    
    // Data on visualization toggle
    addEventListenerSafe('dataOnVisualizationToggle', 'change', function() {
        showDataOnVisualization = this.checked;
    });
    
    // Data stream option toggles
    addEventListenerSafe('mouthOpenOption', 'change', function() {
        dataStreamOptions.mouthOpen = this.checked;
    });
    
    addEventListenerSafe('leftEyeOpenOption', 'change', function() {
        dataStreamOptions.leftEyeOpen = this.checked;
    });
    
    addEventListenerSafe('rightEyeOpenOption', 'change', function() {
        dataStreamOptions.rightEyeOpen = this.checked;
    });
    
    addEventListenerSafe('noseCenterOption', 'change', function() {
        dataStreamOptions.noseCenter = this.checked;
    });
    
    addEventListenerSafe('wristPositionOption', 'change', function() {
        dataStreamOptions.wristPosition = this.checked;
    });
    
    addEventListenerSafe('handOpenOption', 'change', function() {
        dataStreamOptions.handOpen = this.checked;
    });
    
    addEventListenerSafe('fingertipPositionsOption', 'change', function() {
        dataStreamOptions.fingertipPositions = this.checked;
    });
    
    // Trigger toggles
    addEventListenerSafe('winkTrigger', 'change', function() {
        winkTriggerEnabled = this.checked;
    });
    
    addEventListenerSafe('mouthTextTrigger', 'change', function() {
        mouthTextTriggerEnabled = this.checked;
        if (this.checked) {
            // Initialize text when enabled
            quoteWords = criticalTheoryQuote.split(' ');
            currentWordIndex = 0;
        }
    });
    
    addEventListenerSafe('wristCircleTrigger', 'change', function() {
        wristCircleTriggerEnabled = this.checked;
    });
    
    // Fire breath trigger toggle
    addEventListenerSafe('fireBreathTrigger', 'change', function() {
        fireBreathEnabled = this.checked;
        if (!this.checked) {
            clearFireBreath(); // Clear fire when disabled
        }
    });
    
    // Cat eye trigger toggle
    addEventListenerSafe('catEyeTrigger', 'change', function() {
        catEyeTriggerEnabled = this.checked;
    });
    
    // Mouth "WOW" trigger toggle
    addEventListenerSafe('mouthWowTrigger', 'change', function() {
        mouthWowTriggerEnabled = this.checked;
    });
    
    // Cat ears trigger toggle
    addEventListenerSafe('catEarsTrigger', 'change', function() {
        catEarsEnabled = this.checked;
    });
    
    // Eyelashes trigger toggle
    addEventListenerSafe('eyelashesTrigger', 'change', function() {
        eyelashesEnabled = this.checked;
    });
    
    // Whiskers trigger toggle
    addEventListenerSafe('whiskersTrigger', 'change', function() {
        whiskersEnabled = this.checked;
    });
    
    // Red lips trigger toggle
    addEventListenerSafe('redLipsTrigger', 'change', function() {
        redLipsEnabled = this.checked;
    });
}

function updateStatus(message) {
    document.getElementById('status').innerHTML = message;
}

function updateDetectionCounts() {
    // Update total detection count
    let totalCount = faces.length + hands.length;
    document.getElementById('detectionCount').textContent = totalCount;
}

// BEGINNER-FRIENDLY HELPER FUNCTIONS

// Note: Since maxFaces is 1, faces[0] is the only possible face

// Get distance between two landmarks
function getLandmarkDistance(landmark1, landmark2) {
    if (landmark1 && landmark2) {
        return dist(landmark1.x, landmark1.y, landmark2.x, landmark2.y);
    }
    return 0;
}

// Check if hand is making a fist
function isHandFist(hand) {
    if (!hand || !hand.keypoints) return false;
    
    // Simple fist detection: check if fingertips are close to palm
    let palmCenter = hand.keypoints[0]; // Wrist
    let fingertips = [4, 8, 12, 16, 20]; // Thumb, index, middle, ring, pinky tips
    
    let closedFingers = 0;
    for (let tipIndex of fingertips) {
        if (hand.keypoints[tipIndex]) {
            let distance = getLandmarkDistance(palmCenter, hand.keypoints[tipIndex]);
            if (distance < 100) closedFingers++;
        }
    }
    
    return closedFingers >= 3;
}

// Fire particle class for fire breath
class FireParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = random(-2, 2); // Horizontal spread
        this.vy = random(-8, -4); // Upward velocity for fire breath
        this.life = 255;
        this.maxLife = 255;
        this.size = random(3, 12);
        this.colorHue = random(0, 30); // Orange to red range
        this.colorSaturation = random(80, 100);
        this.colorBrightness = random(80, 100);
        this.alpha = 255;
        this.flickerSpeed = random(0.1, 0.3);
        this.flickerPhase = random(0, TWO_PI);
    }
    
    update() {
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Add some fire-like movement
        this.x += sin(frameCount * 0.2 + this.y * 0.01) * 0.8;
        this.y += cos(frameCount * 0.15 + this.x * 0.02) * 0.5;
        
        // Gravity effect (fire rises but eventually falls)
        this.vy += 0.1;
        
        // Reduce life
        this.life -= 3;
        this.alpha = map(this.life, 0, this.maxLife, 0, 255);
        
        // Flicker effect
        this.flickerPhase += this.flickerSpeed;
        
        // Color shift (fire cools as it rises)
        this.colorHue += 0.5;
        if (this.colorHue > 60) this.colorHue = 0;
    }
    
    draw() {
        if (this.life <= 0) return;
        
        push();
        colorMode(HSB, 360, 100, 100, 255);
        
        // Flicker effect
        let flicker = 0.7 + 0.3 * sin(this.flickerPhase);
        let currentAlpha = this.alpha * flicker;
        
        // Draw main fire particle
        fill(this.colorHue, this.colorSaturation, this.colorBrightness, currentAlpha);
        noStroke();
        ellipse(this.x, this.y, this.size, this.size);
        
        // Add fire glow effect
        fill(this.colorHue, this.colorSaturation * 0.6, this.colorBrightness, currentAlpha * 0.4);
        ellipse(this.x, this.y, this.size * 2, this.size * 2);
        
        // Add outer glow
        fill(this.colorHue, this.colorSaturation * 0.3, this.colorBrightness, currentAlpha * 0.2);
        ellipse(this.x, this.y, this.size * 3, this.size * 3);
        
        pop();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

// CREATIVE CODING SPACE FOR BEGINNERS

/*
BEGINNER TIPS:

1. Access detected landmarks:
   - Face: faces[0] - Single face with 478 keypoints (maxFaces: 1)
   - Hands: Loop through hands array - up to 2 hands with 21 keypoints each

2. Create interactive effects:
   - Use landmark positions to control visuals
   - Check distances between points with getLandmarkDistance()
   - Detect gestures like fists with isHandFist()
   - Detect eye states with isLeftEyeOpen() and isRightEyeOpen()

3. Customize colors:
   - Change values in the COLORS object above
   - Use color(red, green, blue) for custom colors

4. Add your own drawings:
   - Use the draw() function to add custom visuals
   - Draw shapes based on landmark positions
   - Create particle systems that follow movements

5. Interactive triggers (see TRIGGERS section):
   - Wink detection: Shows "WINK" text when one eye is closed
   - Mouth text stream: Displays text word-by-word when mouth is open
   - Wrist circle: White circle between wrists that changes size with distance
   - Fire breath: Shoot fire when you open your mouth
   - Cat eye trigger: Cat appears when you close one eye
   - Mouth "WOW": Shows "WOW" when you open your mouth
   
NOTE: To change the mouth text, edit the 'criticalTheoryQuote' variable above.
*/