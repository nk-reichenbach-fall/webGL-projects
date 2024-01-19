import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import WindowsManager from "./WindowsManager";

const DOT_SIZE = 0.2;
const DOT_COLOR = 0xffffff;
const DOT_DENSITY = 0.5;

const SPHERE_RADIUS = 150;
const LATITUDE_COUNT = 80;
const animationSpeed = 0.5;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;

const MASK_IMAGE = "./assets/map.png";

let scene, camera, renderer, imageLoader, world;
let worlds = [];
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };
let initialized = false;

// http://localhost:5173/?clear=true
if (new URLSearchParams(window.location.search).get("clear")) {
  localStorage.clear();
} else {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden" && !initialized) {
      init();
    }
  });

  window.onload = () => {
    if (document.visibilityState !== "hidden") {
      init();
    }
  };

  function init() {
    initialized = true;

    setTimeout(() => {
      setUpScene();
      renderWorlds();
      resize();
      updateWindowShape(false);
      animate();
    }, 500);
  }

  function setUpScene() {
    scene = new THREE.Scene();

    camera = new THREE.OrthographicCamera(
      0,
      0,
      window.innerWidth,
      window.innerHeight,
      -10000,
      10000
    );
    camera.position.z = 2.5;

    renderer = new THREE.WebGLRenderer({ antialias: true, depthBuffer: true });
    renderer.setPixelRatio(pixR);

    world = new THREE.Object3D();
    scene.add(world);

    renderer.domElement.setAttribute("id", "scene");
    document.body.appendChild(renderer.domElement);

    imageLoader = new THREE.ImageLoader();
    WindowsManager.createWindowObject(reRender);
  }

  function renderWorlds() {
    const windows = WindowsManager.getWindows();

    worlds.forEach((w) => {
      world.remove(w);
    });
    worlds = [];

    for (let i = 0; i < windows.length; i++) {
      loadImage(SPHERE_RADIUS + i * 15);
    }
  }

  // Utility function to convert a dot on a sphere into a UV point on a
  // rectangular texture or image.
  const spherePointToUV = (dotCenter, sphereCenter) => {
    // Create a new vector and give it a direction from the center of the sphere
    // to the center of the dot.
    const newVector = new THREE.Vector3();
    newVector.subVectors(sphereCenter, dotCenter).normalize();

    // Calculate the  UV coordinates of the dot and return them as a vector.
    const uvX =
      1 - (0.5 + Math.atan2(newVector.z, newVector.x) / (2 * Math.PI));
    const uvY = 0.5 + Math.asin(newVector.y) / Math.PI;

    return new THREE.Vector2(uvX, uvY);
  };

  // Utility function to sample the data of an image at a given point. Requires
  // an imageData object.
  const sampleImage = (imageData, uv) => {
    // Calculate and return the data for the point, from the UV coordinates.
    const point =
      4 * Math.floor(uv.x * imageData.width) +
      Math.floor(uv.y * imageData.height) * (4 * imageData.width);

    return imageData.data.slice(point, point + 4);
  };

  function loadImage(sphereRadius) {
    imageLoader.load(MASK_IMAGE, (image) => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = image.width;
      tempCanvas.height = image.height;

      const ctx = tempCanvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, image.width, image.height);

      const dotGeometries = [];

      const vector = new THREE.Vector3();
      const win = WindowsManager.getShape();

      // Loop across the latitudes.
      for (let lat = 0; lat < LATITUDE_COUNT; lat += 1) {
        // Calculate the radius of the latitude line.
        const radius =
          Math.cos((-90 + (180 / LATITUDE_COUNT) * lat) * (Math.PI / 180)) *
          sphereRadius;
        // Calculate the circumference of the latitude line.
        const latitudeCircumference = radius * Math.PI * 2 * 2;
        // Calculate the number of dots required for the latitude line.
        const latitudeDotCount = Math.ceil(latitudeCircumference * DOT_DENSITY);

        // Loop across the dot count for the latitude line.
        for (let dot = 0; dot < latitudeDotCount; dot += 1) {
          const dotGeometry = new THREE.CircleGeometry(DOT_SIZE, 5);
          // const innerDotGeometry = new THREE.CircleGeometry(DOT_SIZE, 5);
          // Calculate the phi and theta angles for the dot.
          const phi = (Math.PI / LATITUDE_COUNT) * lat;
          const theta = ((2 * Math.PI) / latitudeDotCount) * dot;

          // Set the vector using the spherical coordinates generated from the sphere radius, phi and theta.
          vector.setFromSphericalCoords(sphereRadius, phi, theta);

          // Make sure the dot is facing in the right direction.
          dotGeometry.lookAt(vector);

          // Move the dot geometry into position.
          dotGeometry.translate(vector.x, vector.y, vector.z);

          dotGeometry.computeBoundingSphere();

          const uv = spherePointToUV(
            dotGeometry.boundingSphere.center,
            new THREE.Vector3()
          );

          const samplePixel = sampleImage(imageData, uv);

          // Push the positioned geometry into the array.
          if (samplePixel[3]) {
            dotGeometries.push(dotGeometry);
          }
        }
      }

      const mergedDotGeometrics =
        BufferGeometryUtils.mergeGeometries(dotGeometries);

      const dotMaterial = new THREE.MeshBasicMaterial({
        color: DOT_COLOR,
        side: THREE.DoubleSide,
        wireframe: true,
      });

      const dotMesh = new THREE.Mesh(mergedDotGeometrics, dotMaterial);

      dotMesh.position.x = win.x + win.w * 0.5;
      dotMesh.position.y = win.y + win.h * 0.5;

      world.add(dotMesh);
      worlds.push(dotMesh);
    });
  }

  function reRender() {
    renderWorlds();
  }

  function updateWindowShape(easing = true) {
    // storing the actual offset in a proxy that we update against in the render function
    sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
    if (!easing) sceneOffset = sceneOffsetTarget;
  }

  function animate(time) {
    // console.log(sceneOffsetTarget);
    WindowsManager.updateWindowChange(updateWindowShape);

    let falloff = 0.05;
    sceneOffset.x =
      sceneOffset.x + (sceneOffsetTarget.x - sceneOffset.x) * falloff;
    sceneOffset.y =
      sceneOffset.y + (sceneOffsetTarget.y - sceneOffset.y) * falloff;

    // set the world position to the offset
    world.position.x = sceneOffset.x;
    world.position.y = sceneOffset.y;

    // Reduce the current timestamp to something manageable.
    time *= 0.001;

    let wins = WindowsManager.getWindows();

    worlds.forEach((w, i) => {
      let win = wins[i];

      let posTarget = {
        x: win.winShape.x + win.winShape.w * 0.5,
        y: win.winShape.y + win.winShape.h * 0.5,
      };

      w.position.x = w.position.x + (posTarget.x - w.position.x) * falloff;
      w.position.y = w.position.y + (posTarget.y - w.position.y) * falloff;

      w.rotation.y = time * 0.1;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    camera = new THREE.OrthographicCamera(0, width, height, 0, -10000, 10000);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
}
