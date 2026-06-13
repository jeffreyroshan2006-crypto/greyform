import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --------------------------------------------------------------------------
// 1. SMOOTH SCROLLING (LENIS)
// --------------------------------------------------------------------------
let lenis;

function initLenis() {
  lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: isTouchDevice ? 1.8 : 1.5,
  });

  // Sync ScrollTrigger with Lenis
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // Smooth Scroll anchor navigation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        // Close mobile drawer if open
        closeMobileMenu();
        
        // Scroll to target with offset
        const headerOffset = 80;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        
        lenis.scrollTo(targetPosition, {
          duration: 1.6,
          immediate: false
        });
      }
    });
  });
}

// --------------------------------------------------------------------------
// 2. PRELOADER & HERO INTRO
// --------------------------------------------------------------------------
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const header = document.getElementById('main-header');
  if (preloader) preloader.style.display = 'none';
  if (header) {
    header.style.transform = 'translateY(0)';
    header.style.opacity = '1';
    header.style.visibility = 'visible';
  }
  document.body.style.overflow = '';
  if (lenis) lenis.start();
}

// --------------------------------------------------------------------------
// 3. CUSTOM INTERACTIVE CURSOR & MAGNETICS
// --------------------------------------------------------------------------
function initCursor() {
  const cursor = document.getElementById('custom-cursor');
  const follower = document.getElementById('custom-cursor-follower');
  
  if (!cursor || !follower) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let followerX = mouseX;
  let followerY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Instantly position dot
    gsap.set(cursor, { x: mouseX, y: mouseY });
  });

  // Interpolate follower cursor with lag
  function updateFollower() {
    const ease = 0.12;
    followerX += (mouseX - followerX) * ease;
    followerY += (mouseY - followerY) * ease;
    
    gsap.set(follower, { x: followerX, y: followerY });
    requestAnimationFrame(updateFollower);
  }
  requestAnimationFrame(updateFollower);

  // Set hover states on interactive classes
  const hoverElements = document.querySelectorAll('a, button, .domain-card, .future-card-inner, .team-card, .mobile-menu-toggle');
  
  hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-hovering');
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-hovering');
    });
  });

  // Magnetic Pull Elements (desktop only)
  const magnetics = document.querySelectorAll('.magnetic');

  if (!isTouchDevice) {
    magnetics.forEach(btn => {
      btn.addEventListener('mousemove', function(e) {
        const bound = this.getBoundingClientRect();
        const strength = parseFloat(this.getAttribute('data-strength')) || 20;

        // Calculate mouse displacement from element center
        const centerX = bound.left + bound.width / 2;
        const centerY = bound.top + bound.height / 2;
        const moveX = (e.clientX - centerX) / (bound.width / 2) * strength;
        const moveY = (e.clientY - centerY) / (bound.height / 2) * strength;

        gsap.to(this, {
          x: moveX,
          y: moveY,
          duration: 0.4,
          ease: 'power2.out'
        });

        // Pull button inner text/spans slightly less for 3D parallax feel
        const inner = this.querySelector('span, svg');
        if (inner) {
          gsap.to(inner, {
            x: moveX * 0.4,
            y: moveY * 0.4,
            duration: 0.4,
            ease: 'power2.out'
          });
        }
      });

      btn.addEventListener('mouseleave', function() {
        gsap.to(this, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.4)'
        });
        const inner = this.querySelector('span, svg');
        if (inner) {
          gsap.to(inner, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: 'elastic.out(1, 0.4)'
          });
        }
      });
    });
  }
}

// --------------------------------------------------------------------------
// 4. HERO BACKGROUND: TOPOLOGICAL MESH & WAVES
// --------------------------------------------------------------------------
function initHeroCanvas() {
  const canvas = document.getElementById('topo');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let W, H, pts = [], t = 0;
  let mouse = { x: null, y: null, targetX: null, targetY: null };

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    
    // Clear and re-populate particles based on screen density
    pts = [];
    const area = W * H;
    const mobileScale = isMobileWidth() ? 0.5 : 1;
    const density = Math.floor(area / 12000) * mobileScale;
    const particleCount = Math.min(isMobileWidth() ? 50 : 100, Math.max(isMobileWidth() ? 15 : 30, density));
    
    for (let i = 0; i < particleCount; i++) {
      pts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        baseVx: (Math.random() - 0.5) * 0.3,
        baseVy: (Math.random() - 0.5) * 0.3,
        vx: 0,
        vy: 0,
        phase: Math.random() * Math.PI * 2,
        r: Math.random() * 1.5 + 0.5
      });
    }
  }

  // Only track mouse on non-touch devices
  if (!isTouchDevice) {
    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    });

    window.addEventListener('mouseleave', () => {
      mouse.targetX = null;
      mouse.targetY = null;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.005;

    // Interpolate mouse coordinates
    if (mouse.targetX !== null) {
      if (mouse.x === null) {
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
      } else {
        mouse.x += (mouse.targetX - mouse.x) * 0.1;
        mouse.y += (mouse.targetY - mouse.y) * 0.1;
      }
    } else {
      mouse.x = null;
      mouse.y = null;
    }

    // Connect nodes
    const connectDist = isMobileWidth() ? 120 : 180;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectDist) {
          ctx.beginPath();
          // Fade connection based on distance
          const alpha = (1 - dist / connectDist) * 0.12;
          ctx.strokeStyle = `rgba(0, 255, 213, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Update and render nodes
    for (const p of pts) {
      const pulse = 0.4 + 0.6 * Math.sin(t + p.phase);
      
      // Render particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + pulse * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 213, ${0.15 + pulse * 0.35})`;
      ctx.fill();

      // Mouse influence (magnetic repulsion/attraction)
      if (!isTouchDevice && mouse.x !== null) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const forceRadius = 220;
        
        if (dist < forceRadius) {
          const force = (forceRadius - dist) / forceRadius;
          const angle = Math.atan2(dy, dx);
          // Gently push particles away
          p.vx += Math.cos(angle) * force * 0.15;
          p.vy += Math.sin(angle) * force * 0.15;
        }
      }

      // Drag/friction and return to baseline velocities
      p.vx = p.vx * 0.9 + p.baseVx * 0.1;
      p.vy = p.vy * 0.9 + p.baseVy * 0.1;

      // Update positions
      p.x += p.vx;
      p.y += p.vy;

      // Screen boundary check with wrapping
      if (p.x < -20) p.x = W + 20;
      if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20;
      if (p.y > H + 20) p.y = -20;
    }

    // Render underlying fluid waves (sine oscillations representing neural EEG)
    ctx.lineWidth = 0.75;
    const waveCount = isMobileWidth() ? 2 : 4;
    for (let i = 0; i < waveCount; i++) {
      const yOffset = H * (0.8 + i * 0.05);
      const waveHeight = 25 - i * 4;
      const speed = 0.8 + i * 0.3;
      
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      
      for (let x = 0; x <= W; x += 10) {
        const sine = Math.sin(x * 0.003 - t * speed + i * 1.5);
        const cosine = Math.cos(x * 0.008 + t * 0.5 * speed);
        const y = yOffset + sine * waveHeight + cosine * (waveHeight * 0.3);
        ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = `rgba(167, 139, 250, ${0.02 + i * 0.015})`;
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

// --------------------------------------------------------------------------
// 5. NEUROPOP BACKGROUND: FLOATING SEMANTIC WORD GRAPH
// --------------------------------------------------------------------------
function initNeuropopCanvas() {
  const canvas = document.getElementById('neuropop-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], t = 0;
  let mouse = { x: null, y: null };

  const words = [
    'Neuroscience', 'Psychology', 'Behavior', 'Culture',
    'Learning', 'Wellbeing', 'Identity', 'Community',
    'Technology', 'Ethics', 'Mind', 'Body'
  ];

  function resize() {
    const parent = canvas.parentElement;
    W = canvas.width = parent.clientWidth;
    H = canvas.height = parent.clientHeight;
    
    // Repopulate nodes matching current dims
    nodes = [];
    words.forEach((word, idx) => {
      nodes.push({
        x: W * 0.2 + Math.random() * W * 0.6,
        y: H * 0.2 + Math.random() * H * 0.6,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        label: word,
        r: Math.random() * 3 + 2.5,
        phase: Math.random() * Math.PI * 2,
        sizeMod: 1.0
      });
    });
  }

  // Only track mouse on non-touch devices for neuropop canvas
  if (!isTouchDevice) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.008;

    // Draw semantic links
    const maxLinkDist = isMobileWidth() ? 110 : 170;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxLinkDist) {
          ctx.beginPath();
          const alpha = (1 - dist / maxLinkDist) * 0.25;
          ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes and labels
    nodes.forEach((n) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + n.phase);
      
      // Calculate mouse proximity attraction
      if (mouse.x !== null) {
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 180) {
          const pull = (180 - dist) / 180;
          const angle = Math.atan2(dy, dx);
          // Pull words gently towards cursor
          n.vx -= Math.cos(angle) * pull * 0.06;
          n.vy -= Math.sin(angle) * pull * 0.06;
          
          // Hover size increase
          n.sizeMod = n.sizeMod * 0.9 + (1.3 + pull * 0.5) * 0.1;
        } else {
          n.sizeMod = n.sizeMod * 0.95 + 1.0 * 0.05;
        }
      } else {
        n.sizeMod = n.sizeMod * 0.95 + 1.0 * 0.05;
      }

      // Add a tiny friction/drag to stabilize
      n.vx *= 0.97;
      n.vy *= 0.97;

      // Update positions
      n.x += n.vx;
      n.y += n.vy;

      // Boundaries with rubber band bounce
      const padding = 50;
      if (n.x < padding) { n.x = padding; n.vx *= -1.2; }
      if (n.x > W - padding) { n.x = W - padding; n.vx *= -1.2; }
      if (n.y < padding) { n.y = padding; n.vy *= -1.2; }
      if (n.y > H - padding) { n.y = H - padding; n.vy *= -1.2; }

      // Draw particle dot
      ctx.beginPath();
      ctx.arc(n.x, n.y, (n.r + pulse * 1.2) * n.sizeMod, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167, 139, 250, ${0.4 + pulse * 0.4})`;
      ctx.fill();

      // Label text - clearer rendering
      const baseFontSize = isMobileWidth() ? 14 : 12;
      const fontSize = Math.floor(baseFontSize * n.sizeMod);
      const fontWeight = isMobileWidth() ? '600' : '500';
      ctx.font = `${fontWeight} ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
      
      // Higher opacity base, with stronger hover contrast
      const baseAlpha = isMobileWidth() ? 0.75 : 0.55;
      const alphaBoost = (n.sizeMod - 1.0) * 1.8;
      const pulseAlpha = pulse * 0.2;
      const finalAlpha = Math.min(1, baseAlpha + alphaBoost + pulseAlpha);
      ctx.fillStyle = `rgba(243, 245, 248, ${finalAlpha})`;
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      // Add subtle text shadow for better readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = isMobileWidth() ? 3 : 2;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      
      ctx.fillText(n.label.toUpperCase(), n.x, n.y - (n.r + fontSize + 2) * n.sizeMod);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

// --------------------------------------------------------------------------
// 6. GSAP SCROLLTRIGGER ANIMATIONS
// --------------------------------------------------------------------------
function initScrollAnimations() {
  // Page reading scroll indicator rail
  gsap.to('#scroll-progress', {
    width: '100%',
    ease: 'none',
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true
    }
  });

  const header = document.getElementById('main-header');
  if (header) {
    header.classList.remove('header-hidden');
    gsap.set(header, { y: 0, opacity: 1 });
  }

  // Section reveals (eyebrows & headers)
  const headings = document.querySelectorAll('.section-header, .belief-left-col');
  headings.forEach(heading => {
    gsap.from(heading.querySelector('.s-title, .belief-quote'), {
      y: 80,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: heading,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    });

    const sub = heading.querySelector('.s-sub, .sticky-label');
    if (sub) {
      gsap.from(sub, {
        opacity: 0,
        y: 20,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: heading,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      });
    }
  });

  // Belief manifesto body paragraph reveal
  const beliefBody = document.querySelector('.belief-body');
  if (beliefBody) {
    gsap.from(beliefBody, {
      opacity: 0,
      y: 40,
      duration: 1.4,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.belief-section',
        start: 'top 75%'
      }
    });
  }

  // Domains card grids entrance
  const domainCards = document.querySelectorAll('.domain-card-outer');
  if (domainCards.length > 0) {
    gsap.from(domainCards, {
      opacity: 0,
      y: 80,
      duration: 1.2,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.domains-grid',
        start: 'top 80%'
      }
    });
  }

  // Neuropop contents entrance
  const neuropopContent = document.querySelector('.neuropop-content-col');
  const neuropopVisual = document.querySelector('.neuropop-visual-col');
  
  if (neuropopContent && neuropopVisual) {
    gsap.from(neuropopContent.children, {
      opacity: 0,
      x: -50,
      duration: 1.2,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.neuropop-section',
        start: 'top 70%'
      }
    });

    gsap.from(neuropopVisual, {
      opacity: 0,
      x: 50,
      duration: 1.4,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.neuropop-section',
        start: 'top 70%'
      }
    });
  }

  // Futures stacked cards parallax depth overlay
  const cards = document.querySelectorAll('.future-card-item');
  cards.forEach((card, index) => {
    // Only apply shrinking scale effect on cards that are covered
    if (index < cards.length - 1) {
      gsap.to(card.querySelector('.future-card-inner'), {
        scale: 0.94 - (cards.length - 1 - index) * 0.01,
        yPercent: -5,
        opacity: 0.7,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          start: 'top 15vh',
          end: () => `+=${window.innerHeight * 0.6}`,
          scrub: true
        }
      });
    }
  });

  // Team cards stagger reveal
  const teamCards = document.querySelectorAll('.team-card-wrapper');
  if (teamCards.length > 0) {
    gsap.from(teamCards, {
      opacity: 0,
      y: 60,
      duration: 1.0,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.team-grid',
        start: 'top 80%'
      }
    });
  }

  // Contact section radial light trigger
  const contactGlow = document.getElementById('contact-glow');
  const contactSec = document.getElementById('contact');
  if (contactGlow && contactSec && !isTouchDevice) {
    contactSec.addEventListener('mousemove', (e) => {
      const rect = contactSec.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      gsap.to(contactGlow, {
        x: x - rect.width / 2,
        y: y - rect.height / 2,
        duration: 0.8,
        ease: 'power2.out'
      });
    });
  }
}

// --------------------------------------------------------------------------
// 7. MOBILE MENU DRAWER
// --------------------------------------------------------------------------
const menuToggle = document.getElementById('menu-toggle');
const mobileDrawer = document.getElementById('mobile-drawer');

function initMobileMenu() {
  if (!menuToggle || !mobileDrawer) return;

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.classList.contains('menu-open');
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });
}

function openMobileMenu() {
  menuToggle.classList.add('menu-open');
  mobileDrawer.classList.add('drawer-open');
  mobileDrawer.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('drawer-open');
  
  // Disable body scroll through Lenis
  if (lenis) lenis.stop();
  document.body.style.overflow = 'hidden';
  document.body.style.overscrollBehavior = 'none';

  // Animate drawer items in
  gsap.from('.drawer-link-item', {
    y: 30,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power3.out',
    delay: 0.2
  });
}

function closeMobileMenu() {
  if (!menuToggle.classList.contains('menu-open')) return;
  
  menuToggle.classList.remove('menu-open');
  mobileDrawer.classList.remove('drawer-open');
  mobileDrawer.setAttribute('aria-hidden', 'true');
  menuToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('drawer-open');
  
  // Re-enable scroll through Lenis
  if (lenis) lenis.start();
  document.body.style.overflow = '';
  document.body.style.overscrollBehavior = '';
}

// --------------------------------------------------------------------------
// 8. ADDITIONAL NAV UTILITIES
// --------------------------------------------------------------------------
function initClock() {
  const clockEl = document.getElementById('chennai-time');
  if (!clockEl) return;
  
  function updateTime() {
    const date = new Date();
    // Offset for Chennai (GMT+5:30)
    const offset = 5.5 * 60 * 60 * 1000;
    const chennaiDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000) + offset);
    
    let hours = chennaiDate.getHours();
    const minutes = chennaiDate.getMinutes().toString().padStart(2, '0');
    const seconds = chennaiDate.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const hoursStr = hours.toString().padStart(2, '0');
    
    clockEl.textContent = `${hoursStr}:${minutes}:${seconds} ${ampm} GMT+5:30`;
  }
  
  updateTime();
  setInterval(updateTime, 1000);
}

function initNavHoverBackdrop() {
  const container = document.querySelector('.nav-container');
  const backdrop = document.getElementById('nav-hover-backdrop');
  const links = document.querySelectorAll('.nav-link-item');
  
  if (!container || !backdrop || links.length === 0) return;
  
  links.forEach(link => {
    link.addEventListener('mouseenter', function() {
      const rect = this.getBoundingClientRect();
      const parentRect = container.getBoundingClientRect();
      
      const left = rect.left - parentRect.left;
      const width = rect.width;
      
      gsap.to(backdrop, {
        left: left - 15,
        width: width + 30,
        opacity: 1,
        scale: 1,
        duration: 0.35,
        ease: 'power2.out'
      });
    });
  });
  
  container.addEventListener('mouseleave', () => {
    gsap.to(backdrop, {
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: 'power2.out'
    });
  });
}

// --------------------------------------------------------------------------
// 9. DEVICE DETECTION & MOBILE OPTIMIZATIONS
// --------------------------------------------------------------------------
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia('(any-pointer: coarse)').matches);
const isMobileWidth = () => window.innerWidth < 768;

// --------------------------------------------------------------------------
// 10. APP INITIALIZATION
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initPreloader();
  
  // Only init custom cursor on non-touch devices
  if (!isTouchDevice) {
    initCursor();
  } else {
    // Hide cursor elements on touch devices
    const cursorEl = document.getElementById('custom-cursor');
    const followerEl = document.getElementById('custom-cursor-follower');
    if (cursorEl) cursorEl.style.display = 'none';
    if (followerEl) followerEl.style.display = 'none';
  }
  
  initHeroCanvas();
  initNeuropopCanvas();
  initScrollAnimations();
  initMobileMenu();
  initClock();
  initNavHoverBackdrop();
  
  // Mobile-specific touch optimizations
  initMobileOptimizations();
});

function initMobileOptimizations() {
  // Prevent double-tap zoom on interactive elements
  document.querySelectorAll('a, button, .domain-card, .neuropop-format-item, .btn-primary, .btn-secondary, .btn-email-primary, .btn-drawer-cta').forEach(el => {
    el.addEventListener('touchend', (e) => {
      // Allow the default action but prevent double-tap zoom
      e.currentTarget.setAttribute('data-last-touch', Date.now());
    }, { passive: true });
  });

  // Prevent 300ms tap delay on mobile
  document.addEventListener('touchstart', () => {}, { passive: true });

  // Handle viewport resize for canvas redraws
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Update ScrollTrigger on resize
      ScrollTrigger.refresh();
    }, 250);
  });

  // Prevent overscroll bounce on iOS when drawer is open
  document.addEventListener('touchmove', (e) => {
    if (document.body.classList.contains('drawer-open')) {
      const drawer = document.getElementById('mobile-drawer');
      if (drawer && !drawer.contains(e.target)) {
        e.preventDefault();
      }
    }
  }, { passive: false });
}
