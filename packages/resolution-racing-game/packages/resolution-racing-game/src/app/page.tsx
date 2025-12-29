'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Asset lists
const GOOD_TEXTS = ["Profit", "Holiday", "Healthy", "Financial Freedom", "Happy", "100x Gem", "Airdrop", "WAGMI", "Bull Market", "Passive Income", "New ATH", "Green Candle", "Freedom", "Good Sleep", "Promotion", "Diamond Hands", "Inner Peace", "Debt Free", "Confidence", "Smart Move"];
const BAD_TEXTS = ["Rekt", "Drain", "Rug Pull", "Bear Market", "Liquidation", "FOMO", "FUD", "High Gas Fee", "Scam", "Phishing", "Red Candle", "Inflation", "Burnout", "Overthinking", "Bad Vibes", "Procrastination", "Insomnia", "Hack", "Panic Sell", "Paper Hands"];

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(50);
  const [gameState, setGameState] = useState<'playing' | 'gameover' | 'victory'>('playing');
  const [combo, setCombo] = useState(0);
  const [bullRunActive, setBullRunActive] = useState(false);
  const [notification, setNotification] = useState<string>('');

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000428, 10, 100);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000428);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);

    // Background sign "NEW YEAR RESOLUTION"
    const signGroup = new THREE.Group();
    const signGeometry = new THREE.PlaneGeometry(20, 4);
    const signMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff, 
      transparent: true, 
      opacity: 0.3,
      side: THREE.DoubleSide 
    });
    const signPlane = new THREE.Mesh(signGeometry, signMaterial);
    signPlane.position.set(0, 8, -50);
    signGroup.add(signPlane);
    
    // Add text using canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NEW YEAR RESOLUTION', 512, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({ 
      map: texture, 
      transparent: true,
      side: THREE.DoubleSide
    });
    const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(20, 4), textMaterial);
    textPlane.position.set(0, 8, -50);
    scene.add(textPlane);

    // Road
    const roadGeometry = new THREE.PlaneGeometry(10, 200);
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0;
    scene.add(road);

    // Lane markers
    const laneMarkers: THREE.Mesh[] = [];
    for (let i = 0; i < 40; i++) {
      const markerGeometry = new THREE.BoxGeometry(0.2, 0.05, 2);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(0, 0.05, -i * 5);
      scene.add(marker);
      laneMarkers.push(marker);
    }

    // Player car (cyan neon sports car)
    const carGroup = new THREE.Group();
    
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(1.2, 0.5, 2.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    carGroup.add(body);
    
    // Car top
    const topGeometry = new THREE.BoxGeometry(1, 0.4, 1.2);
    const top = new THREE.Mesh(topGeometry, bodyMaterial);
    top.position.set(0, 0.95, -0.2);
    carGroup.add(top);
    
    carGroup.position.set(0, 0, 5);
    scene.add(carGroup);

    // Game state
    let currentScore = 50;
    let currentCombo = 0;
    let playerX = 0;
    let gameSpeed = 0.3;
    let bullRunMode = false;
    let bullRunTimer = 0;
    const gates: any[] = [];
    const powerups: any[] = [];
    let spawnTimer = 0;
    let isGameOver = false;

    // Input handling
    const keys: { [key: string]: boolean } = {};
    window.addEventListener('keydown', (e) => { keys[e.key] = true; });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });

    // Create gate function
    function createGate(type: 'good' | 'bad', zPos: number, lane: number) {
      const gateGroup = new THREE.Group();
      
      const isGood = type === 'good';
      const color = isGood ? 0x00ff00 : 0xff0000;
      const text = isGood 
        ? GOOD_TEXTS[Math.floor(Math.random() * GOOD_TEXTS.length)]
        : BAD_TEXTS[Math.floor(Math.random() * BAD_TEXTS.length)];
      
      // Gate posts
      const postGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
      const postMaterial = new THREE.MeshStandardMaterial({ 
        color,
        emissive: color,
        emissiveIntensity: 0.8
      });
      
      const leftPost = new THREE.Mesh(postGeometry, postMaterial);
      leftPost.position.set(-1.5, 1.5, 0);
      gateGroup.add(leftPost);
      
      const rightPost = new THREE.Mesh(postGeometry, postMaterial);
      rightPost.position.set(1.5, 1.5, 0);
      gateGroup.add(rightPost);
      
      // Top bar
      const topGeometry = isGood 
        ? new THREE.BoxGeometry(3.3, 0.3, 0.3)
        : new THREE.BoxGeometry(3.3, 0.5, 0.3);
      const topBar = new THREE.Mesh(topGeometry, postMaterial);
      topBar.position.set(0, 3, 0);
      gateGroup.add(topBar);
      
      // Add spikes for bad gates
      if (!isGood) {
        for (let i = 0; i < 6; i++) {
          const spikeGeometry = new THREE.ConeGeometry(0.15, 0.5, 4);
          const spike = new THREE.Mesh(spikeGeometry, postMaterial);
          spike.position.set(-1.5 + i * 0.6, 2.75, 0);
          spike.rotation.z = Math.PI;
          gateGroup.add(spike);
        }
      }
      
      // Text label
      const textCanvas = document.createElement('canvas');
      textCanvas.width = 512;
      textCanvas.height = 128;
      const textCtx = textCanvas.getContext('2d')!;
      textCtx.fillStyle = isGood ? '#00ff00' : '#ff0000';
      textCtx.font = 'bold 48px Arial';
      textCtx.textAlign = 'center';
      textCtx.textBaseline = 'middle';
      textCtx.fillText(text, 256, 64);
      
      const textTexture = new THREE.CanvasTexture(textCanvas);
      const textMaterial = new THREE.MeshBasicMaterial({ 
        map: textTexture, 
        transparent: true,
        side: THREE.DoubleSide
      });
      const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), textMaterial);
      textMesh.position.set(0, 3.5, 0);
      gateGroup.add(textMesh);
      
      gateGroup.position.set(lane * 3, 0, zPos);
      scene.add(gateGroup);
      
      return { group: gateGroup, type, passed: false, hit: false };
    }

    // Create powerup
    function createPowerup(zPos: number, lane: number) {
      const powerupGroup = new THREE.Group();
      
      // Rocket shape
      const coneGeometry = new THREE.ConeGeometry(0.3, 1, 8);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x0088ff,
        emissive: 0x0088ff,
        emissiveIntensity: 1
      });
      const cone = new THREE.Mesh(coneGeometry, material);
      cone.rotation.x = Math.PI / 2;
      powerupGroup.add(cone);
      
      const cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
      const cylinder = new THREE.Mesh(cylinderGeometry, material);
      cylinder.rotation.z = Math.PI / 2;
      cylinder.position.z = -0.4;
      powerupGroup.add(cylinder);
      
      powerupGroup.position.set(lane * 3, 1.5, zPos);
      scene.add(powerupGroup);
      
      return { group: powerupGroup, hit: false };
    }

    // Show notification
    function showNotification(text: string) {
      setNotification(text);
      setTimeout(() => setNotification(''), 2000);
    }

    // Screen shake
    function screenShake() {
      const originalY = camera.position.y;
      let shakeTime = 0;
      const shakeInterval = setInterval(() => {
        camera.position.y = originalY + (Math.random() - 0.5) * 0.3;
        shakeTime += 50;
        if (shakeTime >= 300) {
          camera.position.y = originalY;
          clearInterval(shakeInterval);
        }
      }, 50);
    }

    // Animation loop
    function animate() {
      if (isGameOver) return;
      requestAnimationFrame(animate);

      // Player movement
      if (keys['ArrowLeft'] || keys['a']) {
        playerX = Math.max(-3, playerX - 0.15);
      }
      if (keys['ArrowRight'] || keys['d']) {
        playerX = Math.min(3, playerX + 0.15);
      }
      carGroup.position.x = playerX;

      // Bull run mode timer
      if (bullRunMode) {
        bullRunTimer -= 0.016;
        if (bullRunTimer <= 0) {
          bullRunMode = false;
          setBullRunActive(false);
          gameSpeed = 0.3;
        }
      }

      // Move lane markers
      laneMarkers.forEach(marker => {
        marker.position.z += gameSpeed;
        if (marker.position.z > 10) {
          marker.position.z -= 200;
        }
      });

      // Spawn gates and powerups
      spawnTimer += 0.016;
      if (spawnTimer > 2) {
        spawnTimer = 0;
        const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const zPos = -60;
        
        // 5% chance for powerup
        if (Math.random() < 0.05) {
          powerups.push(createPowerup(zPos, lane));
        } else {
          const type = Math.random() < 0.6 ? 'good' : 'bad';
          gates.push(createGate(type, zPos, lane));
        }
      }

      // Update gates
      for (let i = gates.length - 1; i >= 0; i--) {
        const gate = gates[i];
        gate.group.position.z += gameSpeed;
        
        // Check collision
        const distance = Math.abs(gate.group.position.z - carGroup.position.z);
        const xDistance = Math.abs(gate.group.position.x - carGroup.position.x);
        
        if (distance < 1.5 && xDistance < 1.5 && !gate.hit) {
          gate.hit = true;
          const pointMultiplier = bullRunMode ? 2 : 1;
          
          if (gate.type === 'good') {
            currentCombo++;
            const basePoints = 10;
            const comboBonus = Math.min(currentCombo - 1, 2) * 5;
            const points = (basePoints + comboBonus) * pointMultiplier;
            currentScore += points;
            showNotification(`+${points} ${currentCombo > 1 ? `Combo x${currentCombo}!` : ''}`);
            setCombo(currentCombo);
          } else {
            currentCombo = 0;
            setCombo(0);
            currentScore -= 10;
            showNotification('-10 Points!');
            screenShake();
          }
          setScore(currentScore);
        }
        
        // Check if passed without hitting (lazy tax for good gates)
        if (gate.group.position.z > carGroup.position.z + 3 && !gate.passed && !gate.hit) {
          gate.passed = true;
          if (gate.type === 'good') {
            currentScore -= 5;
            currentCombo = 0;
            setCombo(0);
            setScore(currentScore);
            showNotification('-5 Lazy Tax');
          }
        }
        
        // Remove if far behind
        if (gate.group.position.z > 20) {
          scene.remove(gate.group);
          gates.splice(i, 1);
        }
      }

      // Update powerups
      for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.group.position.z += gameSpeed;
        powerup.group.rotation.y += 0.05;
        
        const distance = Math.abs(powerup.group.position.z - carGroup.position.z);
        const xDistance = Math.abs(powerup.group.position.x - carGroup.position.x);
        
        if (distance < 1.5 && xDistance < 1.5 && !powerup.hit) {
          powerup.hit = true;
          bullRunMode = true;
          bullRunTimer = 5;
          gameSpeed = 0.6;
          setBullRunActive(true);
          showNotification('BULL RUN MODE! 2x Points!');
        }
        
        if (powerup.group.position.z > 20) {
          scene.remove(powerup.group);
          powerups.splice(i, 1);
        }
      }

      // Check game over / victory
      if (currentScore <= 0) {
        isGameOver = true;
        setGameState('gameover');
      } else if (currentScore >= 500) {
        isGameOver = true;
        setGameState('victory');
      }

      renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', () => {});
      window.removeEventListener('keyup', () => {});
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 text-white font-bold text-2xl z-10">
        <div className={`${score <= 20 ? 'text-red-500' : score >= 400 ? 'text-green-400' : ''}`}>
          Score: {score}
        </div>
        {combo > 1 && (
          <div className="text-yellow-400 text-xl mt-2">
            Combo x{combo}!
          </div>
        )}
        {bullRunActive && (
          <div className="text-blue-400 text-xl mt-2 animate-pulse">
            🚀 BULL RUN MODE! 🚀
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 text-white text-sm z-10 bg-black/50 p-3 rounded">
        <div>← → or A/D to move</div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-4xl z-20 animate-pulse">
          {notification}
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30">
          <h1 className="text-red-500 text-6xl font-bold mb-8">GAME OVER</h1>
          <p className="text-white text-2xl mb-8">Try Again!</p>
          <button 
            onClick={handleRestart}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-xl"
          >
            Restart
          </button>
        </div>
      )}

      {/* Victory Screen */}
      {gameState === 'victory' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30">
          <h1 className="text-green-400 text-6xl font-bold mb-4 animate-pulse">CONGRATULATIONS!</h1>
          <p className="text-cyan-400 text-4xl mb-8">READY FOR 2026! 🎉</p>
          <div className="text-6xl mb-8">🎊 🎉 ✨ 🎊 🎉</div>
          <button 
            onClick={handleRestart}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

