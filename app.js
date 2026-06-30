// --- CUSTOM CURSOR LOGIC ---
const cursor = document.getElementById('custom-cursor');
const follower = document.getElementById('cursor-follower');

let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  
  if (cursor) {
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  }
});

function animateCursor() {
  // Lerp calculation for follower
  followerX += (mouseX - followerX) * 0.12;
  followerY += (mouseY - followerY) * 0.12;
  
  if (follower) {
    follower.style.left = followerX + 'px';
    follower.style.top = followerY + 'px';
  }
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Mouse hover effects for cursor
const hoverElements = document.querySelectorAll('a, button, .patent-card, .timeline-item, .skill-card, .btn, input');
hoverElements.forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.classList.add('hovered');
    follower.classList.add('hovered');
  });
  el.addEventListener('mouseleave', () => {
    cursor.classList.remove('hovered');
    follower.classList.remove('hovered');
  });
});


// --- THREE.JS INTERACTIVE 3D BACKGROUND ---
let scene, camera, renderer, particleSystem, lineSegments;
const particleCount = 120;
const particles = [];
const connectionDistance = 110;

function init3D() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  // Scene & Camera
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050409, 0.0015);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 400;

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Create points
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  // Custom neon blue & violet colors
  const colorCyan = new THREE.Color(0x00f2fe);
  const colorPurple = new THREE.Color(0x9d4edd);

  for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 800;
    const y = (Math.random() - 0.5) * 800;
    const z = (Math.random() - 0.5) * 800;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Save tracking details
    particles.push({
      x, y, z,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      vz: (Math.random() - 0.5) * 0.6
    });

    const mixedColor = colorCyan.clone().lerp(colorPurple, Math.random());
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Point textures & material
  const canvasTexture = createCircleTexture();
  const particleMaterial = new THREE.PointsMaterial({
    size: 5,
    map: canvasTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);

  // Line segment geometry
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x241f38,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lineSegments);

  window.addEventListener('resize', onWindowResize);
  document.addEventListener('mousemove', onDocumentMouseMove);
}

// Generate circular glow texture for nodes
function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.5, 'rgba(0, 242, 254, 0.5)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(canvas);
}

let targetRotationX = 0;
let targetRotationY = 0;

function onDocumentMouseMove(event) {
  targetRotationY = (event.clientX - window.innerWidth / 2) * 0.0003;
  targetRotationX = (event.clientY - window.innerHeight / 2) * 0.0003;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate3D() {
  requestAnimationFrame(animate3D);

  if (!particleSystem) return;

  const positions = particleSystem.geometry.attributes.position.array;
  const linePositions = [];

  // Update node positions
  for (let i = 0; i < particleCount; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.z += p.vz;

    // Bounds checking
    if (p.x < -400 || p.x > 400) p.vx *= -1;
    if (p.y < -400 || p.y > 400) p.vy *= -1;
    if (p.z < -400 || p.z > 400) p.vz *= -1;

    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  }
  particleSystem.geometry.attributes.position.needsUpdate = true;

  // Build connecting circuit lines
  for (let i = 0; i < particleCount; i++) {
    for (let j = i + 1; j < particleCount; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dz = particles[i].z - particles[j].z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < connectionDistance) {
        linePositions.push(particles[i].x, particles[i].y, particles[i].z);
        linePositions.push(particles[j].x, particles[j].y, particles[j].z);
      }
    }
  }

  lineSegments.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  lineSegments.geometry.computeBoundingSphere();

  // Slow rotation & camera mouse react
  particleSystem.rotation.y += 0.001;
  lineSegments.rotation.y += 0.001;

  scene.rotation.x += (targetRotationX - scene.rotation.x) * 0.05;
  scene.rotation.y += (targetRotationY - scene.rotation.y) * 0.05;

  renderer.render(scene, camera);
}

// Initialise Three scene
init3D();
animate3D();


// --- SCROLL REVEAL ANIMATIONS ---
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      // Once revealed, no need to track
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));


// --- NAVIGATION LINK ACTIVE STATE & NAV TOGGLE ---
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link-item');

window.addEventListener('scroll', () => {
  let currentSectionId = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
      currentSectionId = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${currentSectionId}`) {
      link.classList.add('active');
    }
  });
});

const navToggle = document.querySelector('.nav-toggle');
const navLinksContainer = document.querySelector('.nav-links');

if (navToggle && navLinksContainer) {
  navToggle.addEventListener('click', () => {
    if (navLinksContainer.style.display === 'flex') {
      navLinksContainer.style.display = 'none';
    } else {
      navLinksContainer.style.display = 'flex';
      navLinksContainer.style.flexDirection = 'column';
      navLinksContainer.style.position = 'absolute';
      navLinksContainer.style.top = '100%';
      navLinksContainer.style.right = '0';
      navLinksContainer.style.width = '200px';
      navLinksContainer.style.background = 'rgba(12, 10, 22, 0.95)';
      navLinksContainer.style.backdropFilter = 'blur(10px)';
      navLinksContainer.style.border = '1px solid var(--border-color)';
      navLinksContainer.style.borderRadius = '8px';
      navLinksContainer.style.padding = '1rem';
      navLinksContainer.style.gap = '1rem';
    }
  });
}


// --- INTERACTIVE TERMINAL CONSOLE ---
const terminalBody = document.getElementById('terminal-body');
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');

const terminalData = {
  about: `PROFILE: Hariharasudhan S
DOMAIN: Electronics & Communication Engineering (Expected 2027)
LOCATION: Theni, Tamil Nadu, India
SUMMARY: Embedded systems engineer-in-training and co-inventor of 2 patents.
Passionate about closing the loop between hardware signals and code.`,
  
  skills: `PROGRAMMING: Java, Python, C, C++, SQL
HARDWARE: FPGA synthesis, Verilog HDL, Microcontrollers, IoT systems
DESIGN: Canva, Adobe Photoshop, System schematics layout
DOMAINS: Embedded Systems, Cloud Computing, Visual Design`,
  
  experience: `TIMELINE:
2024 (July - August): Embedded Systems Intern at Emglitz Technologies.
- Gained foundational knowledge in embedded system development pipelines.
- Integrated hardware-software nodes and handled microcontroller flashing.`,
  
  patents: `PATENTS:
1. FPGA-Based Voice Controlled Smart Wheelchair System (App No: 202641043994)
   - Real-time voice commands, MFCC feature extraction, and ultrasonic obstacle avoidance.
2. AI-Powered Public Complaint Management Platform (App No: 202641032442)
   - Aadhaar-authenticated ticket routing kiosk with multilingual voice guidance.`,
  
  education: `ACADEMICS:
- B.E. Electronics & Communication Engineering (2023 - 2027)
  VSB College of Engineering and Technical Campus
- Higher Secondary Certificate (HSC) (2022 - 2023)
  St Aloysius Higher Secondary School
- Certification: Google Cloud Fundamentals (Coursera)`,
  
  contact: `CONTACT PORTALS:
Email: harisasi006@gmail.com
GitHub: https://github.com/harisasi006
LeetCode: https://leetcode.com/u/HariSasiiii/`,
  
  help: `SUPPORTED CHANNELS:
- about       Print bio and overview profile
- skills      List technical skillsets
- patents     Display registered patent innovations
- experience  Display professional timeline
- education   Display degrees and certifications
- contact     Show email address and profile links
- clear       Reset the terminal terminal console screen`
};

if (terminalInput && terminalOutput && terminalBody) {
  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const inputVal = terminalInput.value.trim().toLowerCase();
      const promptLine = `visitor@hariharasudhan:~$ ${terminalInput.value}\n`;
      
      let response = '';
      if (inputVal === 'clear') {
        terminalOutput.textContent = 'visitor@hariharasudhan:~$ ';
        terminalInput.value = '';
        return;
      } else if (inputVal in terminalData) {
        response = terminalData[inputVal] + '\n\n';
      } else if (inputVal === '') {
        response = '';
      } else {
        response = `Command not found: "${inputVal}". Type "help" for a list of valid commands.\n\n`;
      }
      
      terminalOutput.textContent += promptLine + response;
      terminalInput.value = '';
      
      // Auto scroll
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
  });

  // Keep terminal text input focused on panel click
  terminalBody.addEventListener('click', () => {
    terminalInput.focus();
  });
}


// --- PATENT MODAL & INTERACTIVE SCHEMATIC SIMULATOR ---
const modalOverlay = document.getElementById('patent-modal');
const modalContentTarget = document.getElementById('modal-content-target');
const modalCloseBtn = document.querySelector('.modal-close');

const patentDetails = {
  wheelchair: {
    title: 'FPGA-Based Voice Controlled Smart Wheelchair System',
    meta: 'Application No: 202641043994 · Indian Patent Office · Published April 2026',
    abstract: 'An FPGA-based smart wheelchair system designed to empower physically disabled individuals with hands-free, safe navigation. Real-time voice commands are captured, converted using MFCC extraction, processed on-chip, and output via PWM signals to wheel motors. Features ultrasonic fail-safe obstacle detection.',
    claims: [
      'An FPGA-based design implementing single-chip voice command decoding and motor operations.',
      'Mel Frequency Cepstral Coefficients (MFCC) feature matching block for low-latency voice command recognition.',
      'Pulse Width Modulation (PWM) speed controls mapping directional signals to differential motor velocities.',
      'Real-time ultrasonic range finder interfacing directly via FPGA hardware registers to trigger interrupt-level automatic braking.'
    ],
    nodes: [
      { id: 'node-mic', label: 'Mic Input / Voice' },
      { id: 'node-adc', label: 'Audio ADC Converter' },
      { id: 'node-fpga', label: 'FPGA Voice Dec (MFCC)' },
      { id: 'node-pwm', label: 'PWM Motor Control' },
      { id: 'node-motor', label: 'Wheel Motors' }
    ]
  },
  kiosk: {
    title: 'AI-Powered Public Complaint Management Platform',
    meta: 'Application No: 202641032442 · Indian Patent Office · Published March 2026',
    abstract: 'A Smart Civic Kiosk platform making complaint filing accessible to rural, elderly, and illiterate citizens. Integrates biometric Aadhaar scanners, multilingual speech-to-text, and a machine learning ticket classification engine to automatically route requests to civic departments.',
    claims: [
      'A secure kiosk architecture integrating Aadhaar fingerprint/iris scanners for authenticated ticket generation.',
      'Multilingual voice guidance system enabling interactive complaint registration via speech.',
      'Automatic NLP parser executing on an edge node to extract issues and assign priority metadata.',
      'A decentralized departmental ticket router with rule-based hierarchical escalation timers.'
    ],
    nodes: [
      { id: 'node-user', label: 'Citizen Input' },
      { id: 'node-aadhaar', label: 'Aadhaar Biometrics' },
      { id: 'node-speech', label: 'Speech-to-Text NLP' },
      { id: 'node-router', label: 'AI Dept Router' },
      { id: 'node-db', label: 'Civic Tickets DB' }
    ]
  }
};

let activeSimInterval = null;

function openPatentModal(patentId) {
  const data = patentDetails[patentId];
  if (!data) return;

  // Clear previous simulation interval if any
  if (activeSimInterval) {
    clearInterval(activeSimInterval);
  }

  // Build schematic nodes html
  let nodesHtml = '';
  data.nodes.forEach((node, index) => {
    nodesHtml += `
      <div class="schematic-node" id="${node.id}">${node.label}</div>
    `;
    if (index < data.nodes.length - 1) {
      nodesHtml += `
        <div class="schematic-arrow" id="arrow-${index}">
          <div class="schematic-arrow-fill"></div>
        </div>
      `;
    }
  });

  // Build claims HTML
  let claimsHtml = '';
  data.claims.forEach((claim, idx) => {
    claimsHtml += `<li><b>[${idx + 1}]</b> ${claim}</li>`;
  });

  const content = `
    <h2 class="modal-title">${data.title}</h2>
    <div class="modal-meta">${data.meta}</div>
    
    <div class="modal-body">
      <div class="modal-text">
        <h4>Functional Abstract</h4>
        <p>${data.abstract}</p>
      </div>

      <div class="schematic-box">
        <h4 style="color: var(--accent-cyan); font-family: var(--font-code); font-size: 0.85rem;">INTERACTIVE HARDWARE SIGNAL FLOW SIMULATOR</h4>
        
        <div class="schematic-diagram">
          ${nodesHtml}
        </div>
        
        <div class="schematic-controls">
          <button class="btn btn-primary" id="start-sim-btn" style="padding: 0.5rem 1.25rem; font-size: 0.8rem;">
            Run Signal Flow
          </button>
        </div>
      </div>

      <div class="modal-text">
        <h4>Key Patent Claims</h4>
        <ul class="modal-claims-list">
          ${claimsHtml}
        </ul>
      </div>
    </div>
  `;

  modalContentTarget.innerHTML = content;
  modalOverlay.style.display = 'flex';
  setTimeout(() => {
    modalOverlay.style.opacity = '1';
  }, 10);

  // Attach button event listener
  const startBtn = document.getElementById('start-sim-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => startSchematicSimulation(data.nodes));
  }

  // Setup cursor hover triggers inside modal
  const modalHoverables = modalContentTarget.querySelectorAll('button, .schematic-node');
  modalHoverables.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hovered');
      follower.classList.add('hovered');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hovered');
      follower.classList.remove('hovered');
    });
  });
}

function startSchematicSimulation(nodes) {
  // Clear previous simulation run
  if (activeSimInterval) {
    clearInterval(activeSimInterval);
  }

  // Reset elements
  nodes.forEach(n => {
    const el = document.getElementById(n.id);
    if (el) el.classList.remove('active');
  });

  for (let i = 0; i < nodes.length - 1; i++) {
    const arrow = document.getElementById(`arrow-${i}`);
    if (arrow) arrow.classList.remove('active');
  }

  let step = 0;
  const maxSteps = nodes.length * 2 - 1; // Nodes + connecting lines

  // Trigger button states
  const simBtn = document.getElementById('start-sim-btn');
  if (simBtn) {
    simBtn.disabled = true;
    simBtn.textContent = 'Simulating...';
    simBtn.style.opacity = '0.5';
  }

  activeSimInterval = setInterval(() => {
    if (step >= maxSteps) {
      clearInterval(activeSimInterval);
      if (simBtn) {
        simBtn.disabled = false;
        simBtn.textContent = 'Run Signal Flow';
        simBtn.style.opacity = '1';
      }
      return;
    }

    if (step % 2 === 0) {
      // It's a Node index
      const nodeIndex = step / 2;
      const nodeObj = nodes[nodeIndex];
      const nodeEl = document.getElementById(nodeObj.id);
      if (nodeEl) {
        nodeEl.classList.add('active');
        // Simple subtle sound or visual effect trigger could go here
      }
    } else {
      // It's an Arrow index
      const arrowIndex = Math.floor(step / 2);
      const arrowEl = document.getElementById(`arrow-${arrowIndex}`);
      if (arrowEl) {
        arrowEl.classList.add('active');
      }
    }

    step++;
  }, 1000);
}

function closeModal() {
  if (activeSimInterval) {
    clearInterval(activeSimInterval);
  }
  
  modalOverlay.style.opacity = '0';
  setTimeout(() => {
    modalOverlay.style.display = 'none';
  }, 300);
}

// Attach event triggers for patent simulation click
const patentBtns = document.querySelectorAll('.patent-btn');
patentBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const patentId = e.currentTarget.getAttribute('data-patent');
    openPatentModal(patentId);
  });
});

if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', closeModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});
