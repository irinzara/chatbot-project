// Avatar animation handling
let scene, camera, renderer, avatar, mixer, clock;

function initAvatar() {
    // Set up Three.js scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0.3, 1.5); // Slightly higher and closer
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
    
    // Position camera
    camera.position.z = 1.5; // Bring camera closer for better view
    
    // Clock for animations
    clock = new THREE.Clock();
    
    // Load avatar model
    const loader = new THREE.GLTFLoader();
    loader.load(
        'chatbot/avatar/avatar.glb',
        function(gltf) {
            avatar = gltf.scene;
            scene.add(avatar);
            avatar.position.y = -1.2;
            
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
        if (Math.random() < 0.005) { // 0.5% chance per frame
            avatar.children[1].scale.y = 0.1; // left eye
            avatar.children[2].scale.y = 0.1; // right eye
            setTimeout(() => {
                if (avatar) {
                    avatar.children[1].scale.y = 1;
                    avatar.children[2].scale.y = 1;
                }
            }, 100);
        }
    }
    
    renderer.render(scene, camera);
}

// Control avatar mouth movement for speech
function startAvatarSpeech() {
    if (avatar && avatar.children[3]) { // mouth element
        avatar.children[3].scale.set(1.8, 1.2, 1); // more exaggerated mouth movement
        // Add subtle eye blink
        avatar.children[1].scale.y = 0.8; // left eye
        avatar.children[2].scale.y = 0.8; // right eye
    }
}

function stopAvatarSpeech() {
    if (avatar && avatar.children[3]) {
        avatar.children[3].scale.set(1, 1, 1);
        // Return eyes to normal
        avatar.children[1].scale.y = 1;
        avatar.children[2].scale.y = 1;
    }
}

// Initialize avatar when DOM is loaded
document.addEventListener('DOMContentLoaded', initAvatar);

function createSimpleAvatar() {
    // Head (slightly larger)
    const headGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFD700,
        specular: 0x111111,
        shininess: 30
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.2; // Raise the head slightly
    
    // Eyes (more prominent)
    const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.25, 0.3, 0.5);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.25, 0.3, 0.5);
    
    // Mouth (more expressive)
    const mouthGeometry = new THREE.TorusGeometry(0.25, 0.03, 16, 32, Math.PI);
    const mouth = new THREE.Mesh(mouthGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    mouth.position.set(0, 0.1, 0.5);
    mouth.rotation.z = Math.PI;
    
    // Add eyebrows for more expression
    const eyebrowGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.05);
    const eyebrowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    leftEyebrow.position.set(0.25, 0.45, 0.5);
    leftEyebrow.rotation.z = -0.2;
    
    const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    rightEyebrow.position.set(-0.25, 0.45, 0.5);
    rightEyebrow.rotation.z = 0.2;
    
    // Group everything together
    avatar = new THREE.Group();
    avatar.add(head);
    avatar.add(leftEye);
    avatar.add(rightEye);
    avatar.add(mouth);
    avatar.add(leftEyebrow);
    avatar.add(rightEyebrow);
    camera.position.z = 2; // Move camera back
    camera.lookAt(avatar.position);

    avatar.position.y = 40;

    scene.add(avatar);
    scene.add(new THREE.AxesHelper(1)); // Shows X/Y/Z axes
    scene.add(new THREE.GridHelper(10, 10)); // Shows ground plane
}