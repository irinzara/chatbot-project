// Avatar animation handling
let scene, camera, renderer, avatar, mixer, clock;
let mouthMesh = null;
let morphTargetDictionary = null;
let morphTargetInfluences = null;

// Viseme mapping for ReadyPlayerMe avatars
const visemeMap = {
    'a': 'mouthOpen',    // Open for "ah" sounds
    'e': 'mouthSmile',   // Smile for "ee" 
    'i': 'mouthPucker',  // Pucker for "ih"
    'o': 'mouthFunnel',  // Funnel for "oh"
    'u': 'mouthOpen',    // Reuse open for "uh"
    'm': 'mouthClosed',  // Closed for M/B/P
    'p': 'mouthClosed',
    'b': 'mouthClosed',
    'f': 'v',            // ReadyPlayerMe uses "v" for F/V
    'v': 'v',
    's': 'mouthUpperUp'  // S/Z sounds
};

function initAvatar() {
    // Set up Three.js scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0.3, 1.5);
    camera.lookAt(0, 0.2, 0);
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(300, 300);
    document.getElementById('avatar-container').appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);
    
    // Clock for animations
    clock = new THREE.Clock();
    
    // Load avatar model
    const loader = new THREE.GLTFLoader();
    loader.load('chatbot/avatar/avatar.glb',
        function(gltf) {
            avatar = gltf.scene;
            avatar.position.y = -1.5;
            avatar.scale.set(3, 3, 3);
            scene.add(avatar);
            
            // Find mouth mesh with morph targets
            avatar.traverse((child) => {
                if (child.isMesh && child.morphTargetInfluences) {
                    console.log("Morph targets available in:", child.name);
                    console.log("All morph targets:", child.morphTargetDictionary);
                    
                    if (child.name === "Wolf3D_Head") {
                        mouthMesh = child;
                        morphTargetDictionary = child.morphTargetDictionary;
                        morphTargetInfluences = child.morphTargetInfluences;
                        
                        // Initialize all morph targets to 0
                        for (let i = 0; i < morphTargetInfluences.length; i++) {
                            morphTargetInfluences[i] = 0;
                        }
                        
                        // Debug: Log important mouth targets
                        console.log("Key mouth targets:", {
                            open: morphTargetDictionary['mouthOpen'],
                            smile: morphTargetDictionary['mouthSmile'],
                            pucker: morphTargetDictionary['mouthPucker'],
                            closed: morphTargetDictionary['mouthClosed']
                        });
                    }
                }
            });
            
            // Set up animation mixer
            mixer = new THREE.AnimationMixer(avatar);
            
            if (gltf.animations && gltf.animations.length > 0) {
                const idleAction = mixer.clipAction(gltf.animations[0]);
                idleAction.play();
            }
            
            // Test mouth movement after load
            // setTimeout(testMouth, 2000);
            
            animate();
        },
        undefined,
        function(error) {
            console.error('Error loading avatar:', error);
            createSimpleAvatar();
        }
    );
}

function testMouth() {
    if (!mouthMesh) {
        console.warn("No mouth mesh found for testing");
        return;
    }
    
    console.log("Testing mouth movement...");
    
    // Test all mouth-related morph targets
    Object.entries(morphTargetDictionary).forEach(([name, index]) => {
        if (name.includes('mouth') || name.includes('jaw') || name.includes('viseme')) {
            console.log(`Activating: ${name}`);
            morphTargetInfluences[index] = 1;
            
            setTimeout(() => {
                morphTargetInfluences[index] = 0;
            }, 1000);
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update animation mixer
    if (mixer) {
        mixer.update(clock.getDelta());
    }
    
    if (avatar) {
        // Subtle idle movements
        // avatar.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
        
        // Random blinking
        if (Math.random() < 0.005) {
            blinkEyes();
        }
    }
    
    renderer.render(scene, camera);
}

function blinkEyes() {
    if (!avatar) return;
    
    avatar.traverse((child) => {
        if (child.name.includes('Eye') || child.name.includes('eye')) {
            child.scale.y = 0.1;
            setTimeout(() => {
                if (child) child.scale.y = 1;
            }, 100);
        }
    });
}

function speakTextWithLipSync(text) {
    if (!mouthMesh || !morphTargetDictionary) {
        console.warn("Lip sync not ready - mouth mesh not initialized");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;

    let animationFrame;
    let currentText = '';

    utterance.onboundary = (event) => {
        if (event.charIndex < currentText.length) {
            const char = currentText[event.charIndex].toLowerCase();
            const viseme = visemeMap[char] || 'mouthOpen';
            const visemeIndex = morphTargetDictionary[viseme];
            
            if (visemeIndex !== undefined) {
                // Reset all influences
                morphTargetInfluences.fill(0);
                
                // Activate current viseme
                morphTargetInfluences[visemeIndex] = 0.7;
                
                // Add jaw movement if available
                const jawIndex = morphTargetDictionary['jawOpen'] || 
                               morphTargetDictionary['mouthOpen'];
                if (jawIndex !== undefined) {
                    morphTargetInfluences[jawIndex] = 0.5;
                }
                
                console.log(`Viseme: ${char} → ${viseme} (index ${visemeIndex})`);
            }
        }
    };

    utterance.onstart = () => {
        currentText = text.toLowerCase();
        console.log("Starting speech:", currentText);
        animationFrame = requestAnimationFrame(animateMouth);
    };

    utterance.onend = () => {
        cancelAnimationFrame(animationFrame);
        morphTargetInfluences.fill(0);
        console.log("Speech ended");
    };

    function animateMouth() {
        // Smooth transitions
        for (let i = 0; i < morphTargetInfluences.length; i++) {
            morphTargetInfluences[i] *= 0.7;
        }
        animationFrame = requestAnimationFrame(animateMouth);
    }

    window.speechSynthesis.speak(utterance);
}

// Fallback simple avatar
function createSimpleAvatar() {
    const headGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.2;
    
    // Simple face components
    const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.25, 0.3, 0.5);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.25, 0.3, 0.5);
    
    const mouthGeometry = new THREE.TorusGeometry(0.25, 0.03, 16, 32, Math.PI);
    const mouth = new THREE.Mesh(mouthGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    mouth.position.set(0, 0.1, 0.5);
    mouth.rotation.z = Math.PI;
    
    avatar = new THREE.Group();
    avatar.add(head, leftEye, rightEye, mouth);
    scene.add(avatar);
    camera.position.z = 2;
}

// Initialize
document.addEventListener('DOMContentLoaded', initAvatar);
window.speakTextWithLipSync = speakTextWithLipSync;
window.testMouth = testMouth; // For debugging