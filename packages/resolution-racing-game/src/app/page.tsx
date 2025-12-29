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
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState('playing');
      }
    }
  }, [countdown, gameState]);

  useEffect(() => {
    if (!mountRef.current) return;
    if (gameState !== 'playing') return;

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
      type: 'good' | 'bad' | 'rocket';
      lane: number;
      passed: boolean;
      text?: string;
    }

    const gameObjects: GameObject[] = [];

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
      textCanvas.height = 256;
      const textCtx = textCanvas.getContext('2d')!;
      textCtx.fillStyle = type === 'good' ? '#00ff00' : '#ff0000';
      textCtx.font = 'bold 80px Arial';
      textCtx.textAlign = 'center';
      textCtx.textBaseline = 'middle';
      textCtx.fillText(text, 512, 128);
      
      const textTexture = new THREE.CanvasTexture(textCanvas);
      const textMaterial = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true });
      const textGeometry = new THREE.PlaneGeometry(5, 1.5);
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, 2.5, 0.3);
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

    // Spawn gates
    function spawnGates() {
      const z = lastGateZ - 20;
      lastGateZ = z;
      
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
      gameObjects.push(createGate('bad', badLane, z, badText));
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
      
      // Update car position (smooth lane switching)
      const targetX = lanePositions[currentLane];
      carGroup.position.x += (targetX - carGroup.position.x) * 0.2;
      
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
        obj.mesh.position.z += gameSpeed;
        
        // Rotation for rockets
        if (obj.type === 'rocket') {
          obj.mesh.rotation.y += 0.05;
        }
        
        // Check collision
        if (obj.mesh.position.z > 3 && obj.mesh.position.z < 7 && !obj.passed) {
          obj.passed = true;
          
          if (obj.lane === currentLane) {
            // Hit the object
            if (obj.type === 'good') {
              combo++;
              const points = bullRunTimer > 0 ? (10 + combo * 5) * 2 : 10 + combo * 5;
              currentScore += points;
              setScore(currentScore);
              setComboCount(combo);
              setFloatingText(`+${points}`);
              setTimeout(() => setFloatingText(''), 1000);
            } else if (obj.type === 'bad') {
              currentScore -= 10;
              setScore(currentScore);
              combo = 0;
              setComboCount(0);
              setFloatingText('-10');
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
              setTimeout(() => setFloatingText(''), 1000);
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
      } else if (currentScore >= 500) {
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
      
      {floatingText && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-4xl animate-bounce">
          {floatingText}
        </div>
      )}
      
      {/* Countdown Screen */}
      {gameState === 'countdown' && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center">
          <h1 className="text-cyan-400 text-8xl font-bold mb-8">
            {countdown > 0 ? countdown : 'GO!'}
          </h1>
          <p className="text-white text-2xl">Get Ready!</p>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center">
          <h1 className="text-red-500 text-6xl font-bold mb-8">GAME OVER</h1>
          <p className="text-white text-2xl mb-8">Try Again!</p>
          <button
            onClick={handleRestart}
            className="px-8 py-4 bg-red-500 text-white text-xl font-bold rounded-lg hover:bg-red-600 transition"
          >
            Restart
          </button>
        </div>
      )}
      
      {/* Victory Screen */}
      {gameState === 'victory' && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center">
          <h1 className="text-green-500 text-6xl font-bold mb-8 animate-pulse">CONGRATULATIONS!</h1>
          <p className="text-white text-3xl mb-8">READY FOR 2026! 🎉</p>
          <div className="text-6xl mb-8">🎊 🎉 ✨</div>
          <button
            onClick={handleRestart}
            className="px-8 py-4 bg-green-500 text-white text-xl font-bold rounded-lg hover:bg-green-600 transition"
          >
            Play Again
          </button>
        </div>
      )}
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center">
        <p className="text-lg">Use ← → or A/D to switch lanes</p>
        <p className="text-sm opacity-70">Green gates: +10 | Red gates: -10 | Blue rockets: Bull Run Mode</p>
      </div>
    </div>
  );
}










