/* ==========================================================================
   SCRIPT FILE: Vanshika Bansal's Interactive 3D Spatial Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThreeDUniverse();
  initPerspectiveCardTilt();
  initProjectFilters();
  initIntersectionReveals();
  initSkillsTelemetry();
  initMobileNavigation();
});

/* ==========================================================================
   1. Interactive Three.js Viewport (Torus Knot wireframe + Drag Orbit + Dynamic RGB)
   ========================================================================== */
let scene, camera, renderer, mainMesh, starNodes;
let mouseX = 0, mouseY = 0;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let meshVelocity = { x: 0.005, y: 0.005 };

function initThreeDUniverse() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05030a, 0.0018); // Deep Space Fog

  // Camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.z = 700;

  // WebGL Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Ambient & Directional Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xff007f, 1.8); // Pink Neon
  dirLight1.position.set(150, 300, 100);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xffaa00, 1.5); // Gold Sunset Glow
  dirLight2.position.set(-150, -300, -100);
  scene.add(dirLight2);

  // 3D Torus Knot Geometry
  const torusGeometry = new THREE.TorusKnotGeometry(120, 28, 220, 16, 3, 4);
  
  // Phong Wireframe Material
  const torusMaterial = new THREE.MeshPhongMaterial({
    color: 0xff007f,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
    shininess: 120,
    blending: THREE.AdditiveBlending
  });

  mainMesh = new THREE.Mesh(torusGeometry, torusMaterial);
  scene.add(mainMesh);

  // Orbiting Constellation Node Array
  const starCount = 950;
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  const colorsPalette = [
    new THREE.Color(0xff007f), // Hot Pink
    new THREE.Color(0x00bfff), // Electric Blue
    new THREE.Color(0x8a2be2), // Space Purple
    new THREE.Color(0xffaa00)  // Gold
  ];

  for (let i = 0; i < starCount * 3; i += 3) {
    const radius = 280 + Math.random() * 320;
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    
    starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[i + 2] = radius * Math.cos(phi);

    const randColor = colorsPalette[Math.floor(Math.random() * colorsPalette.length)];
    starColors[i] = randColor.r;
    starColors[i + 1] = randColor.g;
    starColors[i + 2] = randColor.b;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  // Circle particle canvas texture
  const pCanvas = document.createElement('canvas');
  pCanvas.width = 16;
  pCanvas.height = 16;
  const pCtx = pCanvas.getContext('2d');
  const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.6, 'rgba(255, 0, 127, 0.3)');
  grad.addColorStop(1, 'rgba(255, 0, 127, 0)');
  pCtx.fillStyle = grad;
  pCtx.fillRect(0, 0, 16, 16);
  const particleTexture = new THREE.CanvasTexture(pCanvas);

  const starMaterial = new THREE.PointsMaterial({
    size: 4.5,
    map: particleTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  starNodes = new THREE.Points(starGeometry, starMaterial);
  scene.add(starNodes);

  // Drag Orbit Bindings
  window.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging && mainMesh) {
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      mainMesh.rotation.y += deltaMove.x * 0.005;
      mainMesh.rotation.x += deltaMove.y * 0.005;
      
      meshVelocity = {
        x: deltaMove.y * 0.002,
        y: deltaMove.x * 0.002
      };

      previousMousePosition = { x: e.clientX, y: e.clientY };
    } else {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.03;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.03;
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Drag Orbit Bindings for Mobile Devices
  window.addEventListener('touchstart', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isDragging && mainMesh && e.touches.length > 0) {
      const deltaMove = {
        x: e.touches[0].clientX - previousMousePosition.x,
        y: e.touches[0].clientY - previousMousePosition.y
      };

      mainMesh.rotation.y += deltaMove.x * 0.005;
      mainMesh.rotation.x += deltaMove.y * 0.005;
      
      meshVelocity = {
        x: deltaMove.y * 0.002,
        y: deltaMove.x * 0.002
      };

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('scroll', onScrollCameraMove);

  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onScrollCameraMove() {
  const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
  
  if (camera && mainMesh) {
    camera.position.z = 700 - (scrollPct * 300);
    camera.position.x = Math.sin(scrollPct * Math.PI * 2) * 200;
    mainMesh.position.y = -scrollPct * 150;
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (mainMesh) {
    if (!isDragging) {
      mainMesh.rotation.x += meshVelocity.x;
      mainMesh.rotation.y += meshVelocity.y;

      meshVelocity.x *= 0.95;
      meshVelocity.y *= 0.95;

      if (Math.abs(meshVelocity.x) < 0.003) meshVelocity.x = 0.003;
      if (Math.abs(meshVelocity.y) < 0.004) meshVelocity.y = 0.004;
    }

    // Dynamic neon color shifting on mesh material
    if (mainMesh.material) {
      const time = Date.now() * 0.0006;
      const r = Math.sin(time) * 0.4 + 0.6;
      const g = Math.sin(time + Math.PI / 3) * 0.3 + 0.3;
      const b = Math.sin(time + Math.PI * 2 / 3) * 0.4 + 0.6;
      mainMesh.material.color.setRGB(r, g, b);
    }
  }

  if (starNodes) {
    starNodes.rotation.y -= 0.0006;
    starNodes.rotation.x += 0.0003;
  }

  if (!isDragging) {
    camera.position.x += (mouseX - camera.position.x) * 0.03;
    camera.position.y += (-mouseY - camera.position.y) * 0.03;
    camera.lookAt(scene.position);
  }

  renderer.render(scene, camera);
}

/* ==========================================================================
   2. Real-Time 3D Card Tilt Math Calculations (Tilt.js effect)
   ========================================================================== */
function initPerspectiveCardTilt() {
  const wrappers = document.querySelectorAll('.tilt-card-wrapper');

  wrappers.forEach(wrap => {
    const card = wrap.querySelector('.tilt-card');
    if (!card) return;

    wrap.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const pctX = (mouseX / rect.width - 0.5) * 2;
      const pctY = (mouseY / rect.height - 0.5) * 2;

      const rotX = -pctY * 15;
      const rotY = pctX * 15;

      card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
      
      const reflectionX = (1 - mouseX / rect.width) * 100;
      const reflectionY = (1 - mouseY / rect.height) * 100;
      card.style.setProperty('--reflection-pos', `${reflectionX}% ${reflectionY}%`);
    });

    wrap.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
      card.style.setProperty('--reflection-pos', '50% 50%');
    });
  });
}

/* ==========================================================================
   3. Software / Hardware Projects grid filtering
   ========================================================================== */
function initProjectFilters() {
  window.filterProjects = function(category) {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const wrappers = document.querySelectorAll('.projects-grid .tilt-card-wrapper');

    filterTabs.forEach(tab => tab.classList.remove('active'));
    const activeTab = document.getElementById(`filter-${category}`);
    if (activeTab) activeTab.classList.add('active');

    wrappers.forEach(wrap => {
      const wrapCat = wrap.getAttribute('data-category');
      
      if (category === 'all' || wrapCat === category) {
        wrap.style.display = 'block';
        setTimeout(() => {
          wrap.style.opacity = '1';
          wrap.style.transform = 'scale(1)';
        }, 50);
      } else {
        wrap.style.opacity = '0';
        wrap.style.transform = 'scale(0.95)';
        setTimeout(() => {
          wrap.style.display = 'none';
        }, 300);
      }
    });
  };
}

/* ==========================================================================
   4. Scroll reveal Observer triggers
   ========================================================================== */
function initIntersectionReveals() {
  const reveals = document.querySelectorAll('.reveal-spatial');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px' });

  reveals.forEach(el => observer.observe(el));
}

/* ==========================================================================
   5. Telemetry progress bars filling on screen reveal
   ========================================================================== */
function initSkillsTelemetry() {
  const skillsSec = document.getElementById('skills');
  if (!skillsSec) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fills = document.querySelectorAll('.glow-bar-fill');
        fills.forEach(bar => {
          const pct = bar.getAttribute('data-percentage');
          bar.style.width = pct;
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  observer.observe(skillsSec);
}

/* ==========================================================================
   6. Mobile Navigation panel controls
   ========================================================================== */
function initMobileNavigation() {
  const menuBtn = document.getElementById('menu-btn');
  const navLinks = document.getElementById('nav-links');
  const links = document.querySelectorAll('.nav-links a');

  if (!menuBtn || !navLinks) return;

  const toggle = () => {
    menuBtn.classList.toggle('active');
    navLinks.classList.toggle('active');
  };

  menuBtn.addEventListener('click', toggle);

  links.forEach(l => {
    l.addEventListener('click', () => {
      if (navLinks.classList.contains('active')) toggle();
    });
  });

  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.style.background = 'rgba(12, 8, 28, 0.95)';
      header.style.top = '0';
      header.style.width = '100%';
      header.style.borderRadius = '0';
    } else {
      header.style.background = 'rgba(12, 8, 28, 0.85)';
      header.style.top = '1.5rem';
      header.style.width = '90%';
      header.style.borderRadius = '50px';
    }
  });
}

/* ==========================================================================
   7. Interactive Image Slider Carousel Controls
   ========================================================================== */
window.moveSlide = function(carouselId, direction, event) {
  if (event) {
    event.stopPropagation(); // Stop click from propagating to parent 3D tilt wrappers
    event.preventDefault();
  }
  
  const container = document.getElementById(carouselId);
  if (!container) return;
  
  const slides = container.querySelectorAll('.carousel-slides img');
  if (slides.length <= 1) return;
  
  let activeIndex = -1;
  slides.forEach((slide, idx) => {
    if (slide.classList.contains('active')) {
      activeIndex = idx;
    }
  });
  
  if (activeIndex === -1) return;
  
  // Deactivate current slide
  slides[activeIndex].classList.remove('active');
  
  // Calculate next slide index (circular loop)
  let newIndex = activeIndex + direction;
  if (newIndex >= slides.length) {
    newIndex = 0;
  } else if (newIndex < 0) {
    newIndex = slides.length - 1;
  }
  
  // Activate next slide
  slides[newIndex].classList.add('active');
};

