// Avatar animation handling
let scene, camera, renderer, avatar, mixer, clock;
let mouth = null;
let isSpeaking = false;
const mouthClosedSize = 1.0;
const mouthOpenSize = 1.3;

// Lip sync variables
let morphTargets = {};
const visemeMap = {
    'viseme_sil': 0,    // Silence
    'viseme_PP': 1,     // P, B, M
    'viseme_FF': 2,     // F, V
    'viseme_TH': 3,     // TH
    'viseme_DD': 4,     // D, T
    'viseme_kk': 5,     // K, G
    'viseme_CH': 6,     // CH, J, SH
    'viseme_SS': 7,     // S, Z
    'viseme_nn': 8,     // N, L
    'viseme_RR': 9,     // R
    'viseme_aa': 10,    // A
    'viseme_E': 11,     // E
    'viseme_I': 12,     // I
    'viseme_O': 13,     // O
    'viseme_U': 14      // U
};

function initAvatar() {
    // Set up Three.js scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000);
    camera.position.set(0, 0.25, 0.9);
    camera.lookAt(0, 0.15, 0);
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
    loader.load(
        'chatbot/avatar/avatar.glb',
        function(gltf) {
            avatar = gltf.scene;
            avatar.position.y = -0.6;
            avatar.scale.set(1.3, 1.3, 1.3);
            scene.add(avatar);

            // Find mouth and morph targets
            avatar.traverse(function(child) {
                if (child.isMesh) {
                    // Find mouth mesh
                    if (child.name.toLowerCase().includes('mouth')) {
                        mouth = child;
                    }
                    
                    // Set up morph targets if available
                    if (child.morphTargetDictionary) {
                        morphTargets = {
                            mesh: child,
                            dictionary: child.morphTargetDictionary,
                            influences: child.morphTargetInfluences
                        };
                        
                        // Initialize all morph targets to 0
                        for (let i = 0; i < child.morphTargetInfluences.length; i++) {
                            child.morphTargetInfluences[i] = 0;
                        }
                    }
                }
            });
            
            // Fallback if no mouth found
            if (!mouth && avatar.children.length > 0) {
                mouth = avatar.children.find(child => child.isMesh);
            }
            
            // Set up animation mixer
            mixer = new THREE.AnimationMixer(avatar);
            
            // Start idle animation if available
            if (gltf.animations && gltf.animations.length > 0) {
                const idleAction = mixer.clipAction(gltf.animations[0]);
                idleAction.play();
            }
            
            animate();
        },
        undefined,
        function(error) {
            console.error('Error loading avatar:', error);
            // Fallback to simple shape if avatar fails to load
            const geometry = new THREE.SphereGeometry(0.5, 32, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            avatar = new THREE.Mesh(geometry, material);
            scene.add(avatar);
            animate();
        }
    );
}

function animate() {
    requestAnimationFrame(animate);
    
    if (avatar) {
        // Subtle head movement
        avatar.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
        
        // Blinking animation occasionally
        if (Math.random() < 0.005) {
            if (avatar.children[1]) avatar.children[1].scale.y = 0.1;
            if (avatar.children[2]) avatar.children[2].scale.y = 0.1;
            setTimeout(() => {
                if (avatar) {
                    if (avatar.children[1]) avatar.children[1].scale.y = 1;
                    if (avatar.children[2]) avatar.children[2].scale.y = 1;
                }
            }, 100);
        }
    }
    
    renderer.render(scene, camera);
}

// Lip sync functions
function setViseme(visemeName, intensity = 1.0) {
    if (!morphTargets.mesh || !morphTargets.dictionary) {
        // Fallback to simple mouth movement if no morph targets
        if (mouth) {
            mouth.scale.y = mouthClosedSize + (intensity * 0.3);
        }
        return;
    }
    
    const index = morphTargets.dictionary[visemeName];
    if (index !== undefined) {
        morphTargets.influences[index] = intensity;
    }
}

function resetVisemes() {
    if (morphTargets.influences) {
        for (let i = 0; i < morphTargets.influences.length; i++) {
            morphTargets.influences[i] = 0;
        }
    }
    if (mouth) {
        mouth.scale.y = mouthClosedSize;
    }
}

function startLipSync() {
    isSpeaking = true;
    setViseme('viseme_sil');
}

function stopLipSync() {
    isSpeaking = false;
    resetVisemes();
}

// Speech functions
function speakMessage(text) {
    if (isBotVoiceMuted) return;
    
    synth.cancel();
    startLipSync();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Simple viseme approximation based on speech
    utterance.onboundary = (event) => {
        if (!isSpeaking) return;
        
        const char = text[event.charIndex]?.toLowerCase();
        resetVisemes();
        
        // Basic viseme mapping
        if (!char) return;
        
        if ('pbmy'.includes(char)) setViseme('viseme_PP');
        else if ('fv'.includes(char)) setViseme('viseme_FF');
        else if ('dt'.includes(char)) setViseme('viseme_DD');
        else if ('kg'.includes(char)) setViseme('viseme_kk');
        else if ('ae'.includes(char)) setViseme('viseme_aa');
        else if ('iy'.includes(char)) setViseme('viseme_I');
        else if ('ou'.includes(char)) setViseme('viseme_O');
        else setViseme('viseme_sil');
    };
    
    utterance.onend = utterance.onerror = () => {
        stopLipSync();
    };
    
    synth.speak(utterance);
}

// Initialize avatar when DOM is loaded
document.addEventListener('DOMContentLoaded', initAvatar);

// Fallback simple avatar creation (unchanged)
function createSimpleAvatar() {
    // ... (keep your existing simple avatar code exactly as is) ...
}