let scene, camera, renderer, lighthouse, ocean;
let wavePhase = 0;
let spotLight, spotLightTarget, lightBeamAngle = 0;
let nauticalStar;
let starFacesCamera = true; // Toggle: true = star always faces camera, false = fixed position

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    // Dense fog for visible light beam
    scene.fog = new THREE.FogExp2(0x8899aa, 0.025);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(20, 12, 20);
    camera.lookAt(0, 8, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 25, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    scene.add(directionalLight);

    // Create scene elements
    createOcean();
    createGround();
    createLighthouse();
    createRocks();
    createNauticalStar();

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 };

    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            rotation.y += deltaX * 0.01;
            rotation.x += deltaY * 0.01;

            rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotation.x));

            const radius = 28;
            camera.position.x = radius * Math.sin(rotation.y) * Math.cos(rotation.x);
            camera.position.y = 12 + radius * Math.sin(rotation.x);
            camera.position.z = radius * Math.cos(rotation.y) * Math.cos(rotation.x);
            camera.lookAt(0, 8, 0);

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Zoom
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        const direction = e.deltaY > 0 ? 1 : -1;

        const currentRadius = Math.sqrt(
            camera.position.x ** 2 +
            (camera.position.y - 12) ** 2 +
            camera.position.z ** 2
        );

        const newRadius = Math.max(15, Math.min(50, currentRadius + direction * 0.5));
        const scale = newRadius / currentRadius;

        camera.position.x *= scale;
        camera.position.z *= scale;
        camera.position.y = 12 + (camera.position.y - 12) * scale;
        camera.lookAt(0, 8, 0);
    });

    window.addEventListener('resize', onWindowResize, false);
}

function createOcean() {
    const geometry = new THREE.PlaneGeometry(100, 100, 50, 50);
    const positions = geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        positions[i + 2] = Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.3;
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({
        color: 0x1e90ff,
        flatShading: true,
        side: THREE.DoubleSide
    });

    ocean = new THREE.Mesh(geometry, material);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = 0;
    ocean.receiveShadow = true;
    scene.add(ocean);
}

function createGround() {
    // Rocky ground area
    const groundGeometry = new THREE.CircleGeometry(12, 32);
    const groundMaterial = new THREE.MeshLambertMaterial({
        color: 0x8B8B8B,
        flatShading: true
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grass patches
    const grassMaterial = new THREE.MeshLambertMaterial({
        color: 0x4d8c4d,
        flatShading: true
    });

    for (let i = 0; i < 40; i++) {
        const patchGeometry = new THREE.CircleGeometry(0.3 + Math.random() * 0.4, 6);
        const patch = new THREE.Mesh(patchGeometry, grassMaterial);

        const angle = Math.random() * Math.PI * 2;
        const radius = 4 + Math.random() * 6;
        patch.position.set(
            Math.cos(angle) * radius,
            0.08,
            Math.sin(angle) * radius
        );
        patch.rotation.x = -Math.PI / 2;
        scene.add(patch);
    }
}

function createLighthouse() {
    lighthouse = new THREE.Group();

    // Central cylinder (tan/beige color)
    const centralCylinderGeometry = new THREE.CylinderGeometry(1, 1.2, 18, 8);
    const centralCylinderMaterial = new THREE.MeshLambertMaterial({
        color: 0xD2B48C,
        flatShading: true
    });
    const centralCylinder = new THREE.Mesh(centralCylinderGeometry, centralCylinderMaterial);
    centralCylinder.position.y = 9;
    centralCylinder.castShadow = true;
    lighthouse.add(centralCylinder);

    // Dark base of central cylinder
    const darkBaseGeometry = new THREE.CylinderGeometry(1.2, 1.3, 1.5, 8);
    const darkBaseMaterial = new THREE.MeshLambertMaterial({
        color: 0x333333,
        flatShading: true
    });
    const darkBase = new THREE.Mesh(darkBaseGeometry, darkBaseMaterial);
    darkBase.position.y = 0.75;
    darkBase.castShadow = true;
    lighthouse.add(darkBase);

    // Create the skeletal framework structure
    const frameMaterial = new THREE.MeshLambertMaterial({
        color: 0xaaaaaa,
    });

    // Main support beams - 4 identical supports, one on each side
    const lighthouseHeight = 18;
    const platformThickness = .8;
    const lanternRoomHeight = 1;
    const glassSectionHeight = 3;
    const ground = 0;
    const layers = 5;
    const tierHeight = (lighthouseHeight-ground)/layers;
    const topRadius = 1.2;            // Distance from center at top (just inside platform)
    const bottomRadius = 4;           // Distance from center at ground
    const tierWidth = (bottomRadius - topRadius)/layers;
    const directions = [[1,1],[1,-1],[-1,-1],[-1,1]]
    const heights = [];
    const distances = [];
    const tierCorners = [];

    // Set values for each layer height and distance from top to bottom
    for (let i = 0; i<=layers; i++) {
        heights.push(lighthouseHeight - tierHeight*i)
        distances.push(topRadius + i * tierWidth)
    }

    // Set corner x,z coordinates for each layer
    for (let i=0; i < layers + 1; i++) {
        const corners = []
        for (let dir of directions) {
            const xValue = distances[i] * dir[0]
            const zValue = distances[i] * dir[1]
            corners.push([xValue, zValue])
        }
        tierCorners.push(corners)
    }

    // Helper function to create a beam between two 3D points
    function makeBar(x1, y1, z1, x2, y2, z2, width) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const beamGeometry = new THREE.CylinderGeometry(width/2, width/2, length, 6);
        const beam = new THREE.Mesh(beamGeometry, frameMaterial);

        beam.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);

        const direction = new THREE.Vector3(dx, dy, dz).normalize();
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        beam.setRotationFromQuaternion(quaternion);
        beam.castShadow = true;

        lighthouse.add(beam);
    }

    // main supports
    for (let dir of directions) {
        const topX = distances[0] * dir[0]
        const topZ = distances[0] * dir[1]
        const bottomX = distances[5] * dir[0]
        const bottomZ = distances[5] * dir[1]
        makeBar(topX,lighthouseHeight,topZ,bottomX,ground,bottomZ,.3)
    }

    // secondary supports
    for (let i=0; i < directions.length;i++ ) {
        const even = i % 2 ? 0 : 1;
        const odd = i % 2 ? 1 : 0;
        const topX = distances[3] * directions[i][0] * even;
        const topZ = distances[3] * directions[i][1] * odd;
        const bottomX = distances[5] * directions[i][0] * even;
        const bottomZ = distances[5] * directions[i][1] * odd;
        makeBar(topX,heights[3],topZ,bottomX,ground,bottomZ,.3)
    }

    // horizontal bars
    for (let i=1; i < layers; i++) {
        const height = heights[i]
        const corners = tierCorners[i]
        for (let j = 0; j < 4; j++) {
            makeBar(corners[j][0],height,corners[j][1],corners[(j + 1)%4 ][0],height,corners[(j + 1)%4][1],.3)
        }
    }

    // crossbeams
    for (let i=0; i < 3; i++) {
        const height1 = heights[i]
        const height2 = heights[i+1]
        const topCorners = tierCorners[i]
        const bottomCorners = tierCorners[i+1]
        for (let j = 0; j < 4; j++) {
            const topCorner = topCorners[j]
            const bottomCorner1 = bottomCorners[(j+1)%4]
            const bottomCorner2 = bottomCorners[(j+3)%4]
            makeBar(topCorner[0],height1,topCorner[1],bottomCorner1[0],height2,bottomCorner1[1],.12)
            makeBar(topCorner[0],height1,topCorner[1],bottomCorner2[0],height2,bottomCorner2[1],.12)
        }
    }

    // half crossbeams
    for (let i=3; i < 5; i++) {
        const height1 = heights[i]
        const height2 = heights[i+1]
        const topCorners = tierCorners[i]
        const bottomCorners = tierCorners[i+1]
        for (let j = 0; j < 4; j++) {
            const even = j % 2 ? 0 : 1;
            const odd = j % 2 ? 1 : 0;

            //source corners
            const topCorner = topCorners[j]
            const bottomCorner = bottomCorners[j]

            //target corners
            const bottomCorner1 = bottomCorners[(j+1)%4]
            const bottomCorner2 = bottomCorners[(j+3)%4]
            const topCorner1 = topCorners[(j+1)%4]
            const topCorner2 = topCorners[(j+3)%4]
            makeBar(topCorner[0],height1,topCorner[1],bottomCorner1[0] * even,height2,bottomCorner1[1]*odd,.12)
            makeBar(topCorner[0],height1,topCorner[1],bottomCorner2[0]*odd,height2,bottomCorner2[1]*even,.12)
            makeBar(bottomCorner[0],height2,bottomCorner[1],topCorner1[0]*even,height1,topCorner1[1]*odd,.12)
            makeBar(bottomCorner[0],height2,bottomCorner[1],topCorner2[0]*odd,height1,topCorner2[1]*even,.12)
        }
    }

    // Top platform/gallery (dark gray)
    const platformGeometry = new THREE.CylinderGeometry(2, 2.2, platformThickness, 8);
    const platformMaterial = new THREE.MeshLambertMaterial({
        color: 0x444444,
        flatShading: true
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = lighthouseHeight;
    platform.castShadow = true;
    lighthouse.add(platform);

    // Lantern room (glass/dark structure)
    const lanternBaseGeometry = new THREE.CylinderGeometry(1.5, 1.6, lanternRoomHeight, 8);
    const lanternBaseMaterial = new THREE.MeshLambertMaterial({
        color: 0x2a2a2a,
        flatShading: true
    });
    const lanternBase = new THREE.Mesh(lanternBaseGeometry, lanternBaseMaterial);
    lanternBase.position.y = lighthouseHeight + platformThickness;
    lanternBase.castShadow = true;
    lighthouse.add(lanternBase);

    // Glass section (slightly transparent)
    const glassGeometry = new THREE.CylinderGeometry(1.4, 1.4, glassSectionHeight, 8);
    const glassMaterial = new THREE.MeshLambertMaterial({
        color: 0x88aacc,
        transparent: true,
        opacity: 0.6,
        flatShading: true
    });
    const glassSection = new THREE.Mesh(glassGeometry, glassMaterial);
    glassSection.position.y = lighthouseHeight + platformThickness + lanternRoomHeight;
    lighthouse.add(glassSection);

    // Top dome/roof
    const roofGeometry = new THREE.CylinderGeometry(0.2, 1.6, 1, 8);
    const roofMaterial = new THREE.MeshLambertMaterial({
        color: 0x2a2a2a,
        flatShading: true
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 21.7;
    roof.castShadow = true;
    lighthouse.add(roof);

    // Light source
    const lightGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const lightMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff88
    });
    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.y = 20.5;
    lighthouse.add(light);

    // Point light from lantern (ambient glow)
    const pointLight = new THREE.PointLight(0xffff88, 0.5, 15);
    pointLight.position.y = 20.5;
    lighthouse.add(pointLight);

    // Rotating spotlight beam
    spotLight = new THREE.SpotLight(0xffffcc, 3, 80, Math.PI / 12, 0.3, 1);
    spotLight.position.set(0, 20.5, 0);
    spotLight.castShadow = true;
    lighthouse.add(spotLight);

    // Spotlight target (will be moved to rotate the beam)
    spotLightTarget = new THREE.Object3D();
    spotLightTarget.position.set(30, 15, 0);
    scene.add(spotLightTarget);
    spotLight.target = spotLightTarget;

    // Volumetric light beam cone (visible in fog)
    const beamLength = 50;
    const beamGeometry = new THREE.ConeGeometry(beamLength * Math.tan(Math.PI / 12), beamLength, 32, 1, true);
    const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffaa,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const lightBeam = new THREE.Mesh(beamGeometry, beamMaterial);
    lightBeam.position.y = 20.5;
    lightBeam.rotation.x = Math.PI / 2;
    lightBeam.rotation.z = Math.PI;
    lightBeam.position.z = beamLength / 2;

    // Create a group to rotate the beam
    window.beamGroup = new THREE.Group();
    window.beamGroup.position.y = 0;
    window.beamGroup.add(lightBeam);
    // Reset beam position relative to group
    lightBeam.position.set(0, 20.5, beamLength / 2);
    lighthouse.add(window.beamGroup);

    scene.add(lighthouse);
}

function createRocks() {
    const rockMaterial = new THREE.MeshLambertMaterial({
        color: 0x696969,
        flatShading: true
    });

    for (let i = 0; i < 25; i++) {
        const size = 0.3 + Math.random() * 0.6;
        const geometry = new THREE.DodecahedronGeometry(size, 0);
        const rock = new THREE.Mesh(geometry, rockMaterial);

        const angle = Math.random() * Math.PI * 2;
        const radius = 6 + Math.random() * 5;
        rock.position.set(
            Math.cos(angle) * radius,
            size * 0.3,
            Math.sin(angle) * radius
        );
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
    }
}

function createNauticalStar() {
    // Create a nautical star (8-pointed compass star) using a custom shape
    const starShape = new THREE.Shape();
    const points = 8;
    const outerRadius = 12;
    const innerRadius = 5;

    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
            starShape.moveTo(x, y);
        } else {
            starShape.lineTo(x, y);
        }
    }
    starShape.closePath();

    const starGeometry = new THREE.ShapeGeometry(starShape);
    const starMaterial = new THREE.MeshBasicMaterial({
        color: 0x1a3a5c,
        side: THREE.DoubleSide,
        depthWrite: false,
        transparent: true,
        opacity: 0.7
    });

    nauticalStar = new THREE.Mesh(starGeometry, starMaterial);
    nauticalStar.position.set(0, 10, 0); // Center behind lighthouse
    nauticalStar.renderOrder = -1; // Render first (behind everything)
    scene.add(nauticalStar);

    // Add a circle outline around the star
    const circleGeometry = new THREE.RingGeometry(11.5, 12.5, 64);
    const circleMaterial = new THREE.MeshBasicMaterial({
        color: 0x1a3a5c,
        side: THREE.DoubleSide,
        depthWrite: false,
        transparent: true,
        opacity: 0.7
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.renderOrder = -1;
    nauticalStar.add(circle);

    // Add inner circle
    const innerCircleGeometry = new THREE.RingGeometry(4.5, 5.5, 64);
    const innerCircle = new THREE.Mesh(innerCircleGeometry, circleMaterial.clone());
    innerCircle.renderOrder = -1;
    nauticalStar.add(innerCircle);
}

function animate() {
    requestAnimationFrame(animate);

    // Animate ocean
    wavePhase += 0.02;
    const positions = ocean.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];

        positions[i + 2] =
            Math.sin(x * 0.3 + wavePhase) * Math.cos(y * 0.3 + wavePhase) * 0.4 +
            Math.sin(x * 0.5 - wavePhase * 0.7) * 0.2;
    }

    ocean.geometry.attributes.position.needsUpdate = true;
    ocean.geometry.computeVertexNormals();

    // Rotate the lighthouse beam
    lightBeamAngle += 0.015;
    const beamRadius = 30;
    spotLightTarget.position.x = Math.cos(lightBeamAngle) * beamRadius;
    spotLightTarget.position.z = Math.sin(lightBeamAngle) * beamRadius;

    // Rotate the visible beam cone
    if (window.beamGroup) {
        window.beamGroup.rotation.y = lightBeamAngle;
    }

    // Make nautical star always face the camera (if enabled)
    if (nauticalStar && starFacesCamera) {
        nauticalStar.quaternion.copy(camera.quaternion);
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();
