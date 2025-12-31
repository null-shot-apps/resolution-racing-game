'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Asset lists
const GOOD_TEXTS = ["Profit", "Holiday", "Healthy", "Financial Freedom", "Happy", "100x Gem", "Airdrop", "WAGMI", "Bull Market", "Passive Income", "New ATH", "Green Candle", "Freedom", "Good Sleep", "Promotion", "Diamond Hands", "Inner Peace", "Debt Free", "Confidence", "Smart Move"];
const BAD_TEXTS = ["Rekt", "Drain", "Rug Pull", "Bear Market", "Liquidation", "FOMO", "FUD", "High Gas Fee", "Scam", "Phishing", "Red Candle", "Inflation", "Burnout", "Overthinking", "Bad Vibes", "Procrastination", "Insomnia", "Hack", "Panic Sell", "Paper Hands"];

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(50);
  const [gameState, setGameState] = useState<'countdown' | 'playing' | 'gameover' | 'victory'>('countdown');
  const [comboCount, setComboCount] = useState(0);
  const [bullRunActive, setBullRunActive] = useState(false);
  const [floatingText, setFloatingText] = useState<string>('');
  const [fudStormWarning, setFudStormWarning] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        // Countdown finished, start playing
        setTimeout(() => setGameState('playing'), 500);
      }
    }
  }, [countdown, gameState]);

  useEffect(() => {
    if (!mountRef.current) return;
    if (gameState !== 'playing' && gameState !== 'countdown') return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510);
    scene.fog = new THREE.Fog(0x000510, 10, 100);

    // Camera - elevated view
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 10);
    camera.lookAt(0, 0, -10);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);

    // Background sign "NEW YEAR RESOLUTION"
    const signGroup = new THREE.Group();
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 120px Arial';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NEW YEAR RESOLUTION', canvas.width / 2, canvas.height / 2);
    
    const signTexture = new THREE.CanvasTexture(canvas);
    const signMaterial = new THREE.MeshBasicMaterial({ map: signTexture, transparent: true });
    const signGeometry = new THREE.PlaneGeometry(40, 10);
    const signMesh = new THREE.Mesh(signGeometry, signMaterial);
    signMesh.position.set(0, 15, -80);
    signGroup.add(signMesh);
    
    // Neon glow for sign
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 });
    const glowGeometry = new THREE.PlaneGeometry(42, 12);
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.set(0, 15, -80.1);
    signGroup.add(glowMesh);
    scene.add(signGroup);

    // Road
    const roadGeometry = new THREE.PlaneGeometry(15, 200);
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -50;
    scene.add(road);

    // Lane markers
    const laneMarkers: THREE.Mesh[] = [];
    for (let i = 0; i < 20; i++) {
      const markerGeometry = new THREE.BoxGeometry(0.2, 0.1, 3);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const marker1 = new THREE.Mesh(markerGeometry, markerMaterial);
      marker1.position.set(-2.5, 0.05, -i * 10);
      scene.add(marker1);
      laneMarkers.push(marker1);
      
      const marker2 = new THREE.Mesh(markerGeometry, markerMaterial);
      marker2.position.set(2.5, 0.05, -i * 10);
      scene.add(marker2);
      laneMarkers.push(marker2);
    }

    // Player car (cyan neon sports car)
    const carGroup = new THREE.Group();
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.6, 3),
      new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 })
    );
    carBody.position.y = 0.3;
    carGroup.add(carBody);
    
    const carTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.5, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 })
    );
    carTop.position.set(0, 0.8, -0.3);
    carGroup.add(carTop);
    
    // Add round wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.rotation.z = Math.PI / 2;
    wheelFL.position.set(-0.8, 0.3, 1);
    carGroup.add(wheelFL);
    
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.rotation.z = Math.PI / 2;
    wheelFR.position.set(0.8, 0.3, 1);
    carGroup.add(wheelFR);
    
    const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRL.rotation.z = Math.PI / 2;
    wheelRL.position.set(-0.8, 0.3, -1);
    carGroup.add(wheelRL);
    
    const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRR.rotation.z = Math.PI / 2;
    wheelRR.position.set(0.8, 0.3, -1);
    carGroup.add(wheelRR);
    
    carGroup.position.set(0, 0, 5);
    scene.add(carGroup);

    // Game state
    let currentLane = 1; // 0 = left, 1 = center, 2 = right
    const lanePositions = [-5, 0, 5];
    let gameSpeed = 0.3;
    let lastGateZ = -30;
    let combo = 0;
    let bullRunTimer = 0;
    let currentScore = 50;
    let isGameOver = false;

    interface GameObject {
      mesh: THREE.Group;
      type: 'good' | 'bad' | 'rocket' | 'meteor' | 'gacha';
      lane: number;
      passed: boolean;
      text?: string;
      gachaEffect?: 'jackpot' | 'bullrun' | 'fog' | 'mini';
      velocity?: number;
    }

    const gameObjects: GameObject[] = [];
    
    // Audio context for sound effects
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Sound effect functions
    function playHitSound() {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 200;
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
    
    function playCollectSound() {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    function playCashRegisterSound() {
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator1.frequency.value = 1200;
      oscillator2.frequency.value = 1600;
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator1.start(audioContext.currentTime);
      oscillator2.start(audioContext.currentTime + 0.1);
      oscillator1.stop(audioContext.currentTime + 0.4);
      oscillator2.stop(audioContext.currentTime + 0.5);
    }
    
    // FUD Storm state
    let fudStormTimer = 15 + Math.random() * 5; // 15-20 seconds
    let fogEffect = 0;
    let miniModeTimer = 0;
    let carSpinning = false;
    let spinRotation = 0;

    // Create gate with text
    function createGate(type: 'good' | 'bad', lane: number, z: number, text: string) {
      const group = new THREE.Group();
      
      const color = type === 'good' ? 0x00ff00 : 0xff0000;
      const emissive = type === 'good' ? 0x00ff00 : 0xff0000;
      
      // Gate posts - taller and more visible
      const postGeometry = new THREE.BoxGeometry(0.4, 5, 0.4);
      const postMaterial = new THREE.MeshStandardMaterial({ 
        color, 
        emissive, 
        emissiveIntensity: 1.0 
      });
      
      const leftPost = new THREE.Mesh(postGeometry, postMaterial);
      leftPost.position.set(-2.5, 2.5, 0);
      group.add(leftPost);
      
      const rightPost = new THREE.Mesh(postGeometry, postMaterial);
      rightPost.position.set(2.5, 2.5, 0);
      group.add(rightPost);
      
      // Top bar - wider and more visible
      const topGeometry = type === 'good' 
        ? new THREE.BoxGeometry(5.4, 0.6, 0.4)
        : new THREE.BoxGeometry(5.4, 1.0, 0.4);
      const topMesh = new THREE.Mesh(topGeometry, postMaterial);
      topMesh.position.set(0, 5, 0);
      group.add(topMesh);
      
      // Spikes for bad gates
      if (type === 'bad') {
        for (let i = -2.5; i <= 2.5; i += 1.0) {
          const spikeGeometry = new THREE.ConeGeometry(0.3, 1.0, 4);
          const spike = new THREE.Mesh(spikeGeometry, postMaterial);
          spike.position.set(i, 4.3, 0);
          spike.rotation.x = Math.PI;
          group.add(spike);
        }
      }
      
      // Text label - larger and more readable
      const textCanvas = document.createElement('canvas');
      textCanvas.width = 1024;
      textCanvas.height = 512;
      const textCtx = textCanvas.getContext('2d')!;
      textCtx.fillStyle = type === 'good' ? '#00ff00' : '#ff0000';
      textCtx.font = 'bold 120px Arial';
      textCtx.textAlign = 'center';
      textCtx.textBaseline = 'middle';
      textCtx.fillText(text, 512, 128);
      
      const textTexture = new THREE.CanvasTexture(textCanvas);
      const textMaterial = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true });
      const textGeometry = new THREE.PlaneGeometry(5, 1.5);
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, 6, 0.3);
      group.add(textMesh);
      
      group.position.set(lanePositions[lane], 0, z);
      scene.add(group);
      
      return { mesh: group, type, lane, passed: false, text };
    }

    // Create rocket power-up
    function createRocket(lane: number, z: number) {
      const group = new THREE.Group();
      
      const rocketGeometry = new THREE.ConeGeometry(0.5, 2, 8);
      const rocketMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0088ff, 
        emissive: 0x0088ff, 
        emissiveIntensity: 1 
      });
      const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
      rocket.rotation.x = -Math.PI / 2;
      rocket.position.y = 2;
      group.add(rocket);
      
      // Glow
      const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x0088ff, 
        transparent: true, 
        opacity: 0.3 
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.y = 2;
      group.add(glow);
      
      group.position.set(lanePositions[lane], 0, z);
      scene.add(group);
      
      return { mesh: group, type: 'rocket' as const, lane, passed: false };
    }
    
    // Create meteor (FUD Storm)
    function createMeteor(lane: number, z: number) {
      const group = new THREE.Group();
      
      const meteorGeometry = new THREE.SphereGeometry(0.6, 16, 16);
      const meteorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff6600, 
        emissive: 0xff6600, 
        emissiveIntensity: 1.5 
      });
      const meteor = new THREE.Mesh(meteorGeometry, meteorMaterial);
      meteor.position.y = 15; // Start high up
      group.add(meteor);
      
      // Glow
      const glowGeometry = new THREE.SphereGeometry(0.9, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff6600, 
        transparent: true, 
        opacity: 0.4 
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.y = 15;
      group.add(glow);
      
      group.position.set(lanePositions[lane], 0, z);
      scene.add(group);
      
      return { mesh: group, type: 'meteor' as const, lane, passed: false, velocity: 0.3 };
    }
    
    // Create gacha box
    function createGachaBox(lane: number, z: number) {
      const group = new THREE.Group();
      
      // Purple box
      const boxGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const boxMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x9900ff, 
        emissive: 0x9900ff, 
        emissiveIntensity: 0.8 
      });
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.y = 1.5;
      group.add(box);
      
      // Question mark
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 200px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 128, 128);
      
      const texture = new THREE.CanvasTexture(canvas);
      const textMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const textGeometry = new THREE.PlaneGeometry(1, 1);
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, 1.5, 0.61);
      group.add(textMesh);
      
      // Glow
      const glowGeometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x9900ff, 
        transparent: true, 
        opacity: 0.3 
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.y = 1.5;
      group.add(glow);
      
      group.position.set(lanePositions[lane], 0, z);
      scene.add(group);
      
      // Random gacha effect
      const effects: ('jackpot' | 'bullrun' | 'fog' | 'mini')[] = ['jackpot', 'bullrun', 'fog', 'mini'];
      const effect = effects[Math.floor(Math.random() * effects.length)];
      
      return { mesh: group, type: 'gacha' as const, lane, passed: false, gachaEffect: effect };
    }
    
    // Trigger FUD Storm
    function triggerFudStorm() {
      setFudStormWarning(true);
      setTimeout(() => setFudStormWarning(false), 2000);
      
      // Spawn 5-10 meteors
      const meteorCount = 5 + Math.floor(Math.random() * 6);
      for (let i = 0; i < meteorCount; i++) {
        const lane = Math.floor(Math.random() * 3);
        const z = -20 - Math.random() * 40;
        gameObjects.push(createMeteor(lane, z));
      }
    }

    // Spawn gates
    function spawnGates() {
      const z = lastGateZ - 20;
      lastGateZ = z;
      
      // Randomly spawn gacha box (5% chance)
      if (Math.random() < 0.05) {
        const gachaLane = Math.floor(Math.random() * 3);
        gameObjects.push(createGachaBox(gachaLane, z));
        return;
      }
      
      // Randomly spawn rocket (10% chance)
      if (Math.random() < 0.1) {
        const rocketLane = Math.floor(Math.random() * 3);
        gameObjects.push(createRocket(rocketLane, z));
        return;
      }
      
      // Spawn 2 gates (1 good, 1 bad)
      const lanes = [0, 1, 2];
      const shuffled = lanes.sort(() => Math.random() - 0.5);
      
      const goodLane = shuffled[0];
      const badLane = shuffled[1];
      
      const goodText = GOOD_TEXTS[Math.floor(Math.random() * GOOD_TEXTS.length)];
      const badText = BAD_TEXTS[Math.floor(Math.random() * BAD_TEXTS.length)];
      
      gameObjects.push(createGate('good', goodLane, z, goodText));
      gameObjects.push(createGate('bad', badLane, z - 3, badText));
    }

    // Initial gates
    for (let i = 0; i < 5; i++) {
      spawnGates();
    }

    // Input handling
    function handleKeyDown(e: KeyboardEvent) {
      if (isGameOver) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        currentLane = Math.max(0, currentLane - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        currentLane = Math.min(2, currentLane + 1);
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);

    // Animation loop
    function animate() {
      if (isGameOver) return;
      
      requestAnimationFrame(animate);
      
      // Don't update game logic during countdown
      if (gameState === 'countdown') {
        renderer.render(scene, camera);
        return;
      }
      
      // Update car position (smooth lane switching)
      const targetX = lanePositions[currentLane];
      carGroup.position.x += (targetX - carGroup.position.x) * 0.2;
      
      // Handle car spinning
      if (carSpinning) {
        spinRotation += 0.15;
        carGroup.rotation.y = spinRotation;
        if (spinRotation >= Math.PI * 2) {
          carSpinning = false;
          spinRotation = 0;
          carGroup.rotation.y = 0;
        }
      }
      
      // Update mini mode
      if (miniModeTimer > 0) {
        miniModeTimer -= 0.016;
        carGroup.scale.set(0.5, 0.5, 0.5);
        if (miniModeTimer <= 0) {
          carGroup.scale.set(1, 1, 1);
        }
      }
      
      // Update fog effect
      if (fogEffect > 0) {
        fogEffect -= 0.016;
        scene.fog = new THREE.Fog(0x000510, 5, 30);
        if (fogEffect <= 0) {
          scene.fog = new THREE.Fog(0x000510, 10, 100);
        }
      }
      
      // FUD Storm timer
      fudStormTimer -= 0.016;
      if (fudStormTimer <= 0) {
        triggerFudStorm();
        fudStormTimer = 15 + Math.random() * 5;
      }
      
      // Update bull run timer
      if (bullRunTimer > 0) {
        bullRunTimer -= 0.016;
        if (bullRunTimer <= 0) {
          setBullRunActive(false);
          gameSpeed /= 1.5;
        }
      }
      
      // Move lane markers
      laneMarkers.forEach(marker => {
        marker.position.z += gameSpeed;
        if (marker.position.z > 10) {
          marker.position.z -= 200;
        }
      });
      
      // Move and check game objects
      for (let i = gameObjects.length - 1; i >= 0; i--) {
        const obj = gameObjects[i];
        
        // Special movement for meteors (falling)
        if (obj.type === 'meteor') {
          obj.mesh.position.z += gameSpeed;
          obj.mesh.children[0].position.y -= obj.velocity!;
          obj.mesh.children[1].position.y -= obj.velocity!;
          obj.mesh.rotation.x += 0.1;
          obj.mesh.rotation.y += 0.05;
        } else {
          obj.mesh.position.z += gameSpeed;
        }
        
        // Rotation for rockets and gacha boxes
        if (obj.type === 'rocket') {
          obj.mesh.rotation.y += 0.05;
        } else if (obj.type === 'gacha') {
          obj.mesh.rotation.y += 0.03;
          obj.mesh.children[0].position.y = 1.5 + Math.sin(Date.now() * 0.003) * 0.3;
        }
        
        // Check collision
        const collisionZ = obj.type === 'meteor' ? (obj.mesh.children[0].position.y <= 1) : (obj.mesh.position.z > 3 && obj.mesh.position.z < 7);
        
        if (collisionZ && !obj.passed) {
          obj.passed = true;
          
          if (obj.lane === currentLane || (obj.type === 'meteor' && obj.mesh.children[0].position.y <= 1)) {
            // Hit the object
            if (obj.type === 'good') {
              combo++;
              const points = bullRunTimer > 0 ? (10 + combo * 5) * 2 : 10 + combo * 5;
              currentScore += points;
              setScore(currentScore);
              setComboCount(combo);
              setFloatingText(`+${points}`);
              playCollectSound();
              setTimeout(() => setFloatingText(''), 1000);
            } else if (obj.type === 'bad') {
              currentScore -= 10;
              setScore(currentScore);
              combo = 0;
              setComboCount(0);
              setFloatingText('-10');
              playHitSound();
              setTimeout(() => setFloatingText(''), 1000);
              
              // Screen shake
              camera.position.x += (Math.random() - 0.5) * 0.5;
              camera.position.y += (Math.random() - 0.5) * 0.5;
              setTimeout(() => {
                camera.position.x = 0;
                camera.position.y = 8;
              }, 100);
            } else if (obj.type === 'rocket') {
              bullRunTimer = 5;
              setBullRunActive(true);
              gameSpeed *= 1.5;
              setFloatingText('BULL RUN!');
              playCollectSound();
              setTimeout(() => setFloatingText(''), 1000);
            } else if (obj.type === 'meteor') {
              // Hit by meteor
              if (obj.lane === currentLane) {
                currentScore -= 20;
                setScore(currentScore);
                combo = 0;
                setComboCount(0);
                setFloatingText('-20 METEOR HIT!');
                playHitSound();
                setTimeout(() => setFloatingText(''), 1000);
                
                // Spin car 360 degrees
                carSpinning = true;
                spinRotation = 0;
                
                // Screen shake
                camera.position.x += (Math.random() - 0.5) * 0.8;
                camera.position.y += (Math.random() - 0.5) * 0.8;
                setTimeout(() => {
                  camera.position.x = 0;
                  camera.position.y = 8;
                }, 150);
              }
            } else if (obj.type === 'gacha') {
              // Gacha box effects
              const effect = obj.gachaEffect!;
              
              if (effect === 'jackpot') {
                currentScore += 50;
                setScore(currentScore);
                setFloatingText('💰 JACKPOT +50!');
                playCashRegisterSound();
              } else if (effect === 'bullrun') {
                bullRunTimer = 5;
                setBullRunActive(true);
                gameSpeed *= 1.5;
                combo = Math.max(combo, 3);
                setComboCount(combo);
                setFloatingText('🚀 BULL RUN x2!');
                playCollectSound();
              } else if (effect === 'fog') {
                fogEffect = 3;
                setFloatingText('🌫️ FUD FOG!');
                playHitSound();
              } else if (effect === 'mini') {
                miniModeTimer = 5;
                setFloatingText('🔬 MINI MODE!');
                playCollectSound();
              }
              
              setTimeout(() => setFloatingText(''), 1500);
            }
          } else {
            // Missed a good gate (Lazy Tax)
            if (obj.type === 'good') {
              currentScore -= 5;
              setScore(currentScore);
              combo = 0;
              setComboCount(0);
              setFloatingText('-5 Lazy Tax');
              setTimeout(() => setFloatingText(''), 1000);
            }
          }
        }
        
        // Remove if too far and respawn
        if (obj.mesh.position.z > 15) {
          scene.remove(obj.mesh);
          gameObjects.splice(i, 1);
          // Spawn new gates to keep them coming
          spawnGates();
        }
      }
      
      // Speed progression
      gameSpeed += 0.00005;
      
      // Check game over/victory
      if (currentScore <= 0) {
        isGameOver = true;
        setGameState('gameover');
      } else if (currentScore >= 2000) {
        isGameOver = true;
        setGameState('victory');
      }
      
      renderer.render(scene, camera);
    }
    
    animate();

    // Handle resize
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [gameState]);

  const handleRestart = () => {
    setScore(50);
    setGameState('countdown');
    setCountdown(3);
    setComboCount(0);
    setBullRunActive(false);
    setFloatingText('');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 text-white font-bold text-2xl">
        Score: {score}
      </div>
      
      {comboCount > 0 && (
        <div className="absolute top-16 left-4 text-yellow-400 font-bold text-xl">
          Combo x{comboCount}
        </div>
      )}
      
      {bullRunActive && (
        <div className="absolute top-4 right-4 text-blue-400 font-bold text-2xl animate-pulse">
          🚀 BULL RUN MODE 🚀
        </div>
      )}
      
      {fudStormWarning && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-orange-500 font-bold text-5xl animate-pulse drop-shadow-[0_0_20px_rgba(255,102,0,1)]">
          ⚠️ WARNING: FUD STORM! ⚠️
        </div>
      )}
      
      {floatingText && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-4xl animate-bounce">
          {floatingText}
        </div>
      )}
      
      {/* Countdown Overlay */}
      {gameState === 'countdown' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <h1 className="text-cyan-400 text-9xl font-bold drop-shadow-[0_0_30px_rgba(0,255,255,1)] animate-pulse">
            {countdown > 0 ? countdown : 'GO!'}
          </h1>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-black bg-opacity-90 rounded-2xl p-8 max-w-sm pointer-events-auto border-2 border-red-500">
            <h1 className="text-red-500 text-4xl font-bold mb-4">GAME OVER</h1>
            <p className="text-white text-xl mb-6">Try Again!</p>
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-red-500 text-white text-lg font-bold rounded-lg hover:bg-red-600 transition w-full"
            >
              Restart
            </button>
          </div>
        </div>
      )}
      
      {/* Victory Screen */}
      {gameState === 'victory' && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-black bg-opacity-90 rounded-2xl p-8 max-w-sm pointer-events-auto border-2 border-green-500">
            <h1 className="text-green-500 text-4xl font-bold mb-4 animate-pulse">CONGRATULATIONS!</h1>
            <p className="text-white text-2xl mb-4">READY FOR 2026! 🎉</p>
            <div className="text-4xl mb-6">🎊 🎉 ✨</div>
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 transition w-full"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center">
        <p className="text-lg">Use ← → or A/D to switch lanes</p>
        <p className="text-sm opacity-70">Green gates: +10 | Red gates: -10 | Blue rockets: Bull Run | Purple boxes: Mystery!</p>
        <p className="text-xs opacity-50 mt-1">Watch out for FUD Storms! 🌩️</p>
      </div>
    </div>
  );
}































