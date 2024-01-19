import * as t from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

import WindowManager from "./WindowManager.js";

// const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let cubes = [];
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };

const DOT_SIZE = 0.2;
const DOT_COLOR = 0xffffff;
const WATER_COLOR = 0x416bdf;
const DOT_COLOR2 = 0xfff000;
const DOT_DENSITY = 0.03;

const SPHERE_RADIUS = 100;
const LATITUDE_COUNT = 30;

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let windowManager;
let initialized = false;

// get time in seconds since beginning of the day (so that all windows use the same time)
function getTime() {
  return (new Date().getTime() - today) / 1000.0;
}

if (new URLSearchParams(window.location.search).get("clear")) {
  localStorage.clear();
} else {
  // this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState != "hidden" && !initialized) {
      init();
    }
  });

  window.onload = () => {
    if (document.visibilityState != "hidden") {
      init();
    }
  };

  function init() {
    initialized = true;

    // add a short timeout because window.offsetX reports wrong values before a short period
    setTimeout(() => {
      setupScene();
      setupWindowManager();
      resize();
      updateWindowShape(false);
      render();
      window.addEventListener("resize", resize);
    }, 500);
  }

  function setupScene() {
    camera = new t.OrthographicCamera(
      0,
      0,
      window.innerWidth,
      window.innerHeight,
      -10000,
      10000
    );

    camera.position.z = 2.5;
    near = camera.position.z - 0.5;
    far = camera.position.z + 0.5;

    scene = new t.Scene();
    scene.background = new t.Color(0.0);
    scene.add(camera);

    renderer = new t.WebGLRenderer({ antialias: true, depthBuffer: true });
    renderer.setPixelRatio(pixR);

    world = new t.Object3D();
    scene.add(world);

    renderer.domElement.setAttribute("id", "scene");
    document.body.appendChild(renderer.domElement);
  }

  function setupWindowManager() {
    windowManager = new WindowManager();
    windowManager.setWinShapeChangeCallback(updateWindowShape);
    windowManager.setWinChangeCallback(windowsUpdated);

    // here you can add your custom metadata to each windows instance
    let metaData = { foo: "bar" };

    // this will init the windowmanager and add this window to the centralised pool of windows
    windowManager.init(metaData);

    // call update windows initially (it will later be called by the win change callback)
    windowsUpdated();
  }

  function windowsUpdated() {
    updateNumberOfCubes();
  }

  function updateNumberOfCubes() {
    let wins = windowManager.getWindows();

    // remove all cubes
    cubes.forEach((c) => {
      world.remove(c);
    });

    cubes = [];

    // add new cubes based on the current window setup
    for (let i = 0; i < wins.length; i++) {
      let win = wins[i];
      console.log(win);

      let c = new t.Color();
      c.setHSL(i * 0.1, 1.0, 0.5);

      let s = 100 + i * 50;
      const vector = new t.Vector3();
      const dotGeometries = [];

      for (let lat = 0; lat < LATITUDE_COUNT; lat += 1) {
        // Calculate the radius of the latitude line.
        const radius =
          Math.cos((-90 + (180 / LATITUDE_COUNT) * lat) * (Math.PI / 180)) *
            SPHERE_RADIUS +
          i * 20;
        // Calculate the circumference of the latitude line.
        const latitudeCircumference = radius * Math.PI * 2 * 2;
        // Calculate the number of dots required for the latitude line.
        const latitudeDotCount = Math.ceil(latitudeCircumference * DOT_DENSITY);

        // Loop across the dot count for the latitude line.
        for (let dot = 0; dot < latitudeDotCount; dot += 1) {
          const dotGeometry = new t.CircleGeometry(DOT_SIZE, 5);
          // const innerDotGeometry = new THREE.CircleGeometry(DOT_SIZE, 5);
          // Calculate the phi and theta angles for the dot.
          const phi = (Math.PI / LATITUDE_COUNT) * lat;
          const theta = ((2 * Math.PI) / latitudeDotCount) * dot;

          // Set the vector using the spherical coordinates generated from the sphere radius, phi and theta.
          vector.setFromSphericalCoords(SPHERE_RADIUS + i * 20, phi, theta);
          // innerVector.setFromSphericalCoords(SPHERE_RADIUS, phi, theta);

          // Make sure the dot is facing in the right direction.
          dotGeometry.lookAt(vector);
          // innerDotGeometry.lookAt(vector);

          // Move the dot geometry into position.
          dotGeometry.translate(vector.x, vector.y, vector.z);
          // innerDotGeometry.translate(innerVector.x, innerVector.y, innerVector.z);

          dotGeometry.computeBoundingSphere();

          //   const uv = spherePointToUV(
          //     dotGeometry.boundingSphere.center,
          //     new THREE.Vector3()
          //   );

          //   const samplePixel = sampleImage(imageData, uv);

          // Push the positioned geometry into the array.
          //   if (samplePixel[3]) {
          dotGeometries.push(dotGeometry);
          //     // innerSphere.push(innerDotGeometry);
          //   } else {
          //     waterGeometries.push(dotGeometry);
          //   }
        }
      }
      const mergedDotGeometrics =
        BufferGeometryUtils.mergeGeometries(dotGeometries);

      const dotMaterial = new t.MeshBasicMaterial({
        color: c,
        side: t.DoubleSide,
        wireframe: true,
      });

      const dotMesh = new t.Mesh(mergedDotGeometrics, dotMaterial);

      //   let particleWorld =
      //   let cube = new t.Mesh(
      //     new t.BoxGeometry(s, s, s),
      //     // mergedDotGeometrics,
      //     new t.MeshBasicMaterial({ color: c, wireframe: true })
      //   );
      dotMesh.position.x = win.shape.x + win.shape.w * 0.5;
      dotMesh.position.y = win.shape.y + win.shape.h * 0.5;

      //   world.add(cube);
      world.add(dotMesh);
      cubes.push(dotMesh);
      //   cubes.push(cube);
    }
  }

  function updateWindowShape(easing = true) {
    // storing the actual offset in a proxy that we update against in the render function
    sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
    if (!easing) sceneOffset = sceneOffsetTarget;
  }

  function render() {
    let t = getTime();

    windowManager.update();

    // calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
    let falloff = 0.05;
    sceneOffset.x =
      sceneOffset.x + (sceneOffsetTarget.x - sceneOffset.x) * falloff;
    sceneOffset.y =
      sceneOffset.y + (sceneOffsetTarget.y - sceneOffset.y) * falloff;

    // set the world position to the offset
    world.position.x = sceneOffset.x;
    world.position.y = sceneOffset.y;

    let wins = windowManager.getWindows();

    // loop through all our cubes and update their positions based on current window positions
    for (let i = 0; i < cubes.length; i++) {
      let cube = cubes[i];
      let win = wins[i];
      let _t = t; // + i * .2;

      let posTarget = {
        x: win.shape.x + win.shape.w * 0.5,
        y: win.shape.y + win.shape.h * 0.5,
      };

      cube.position.x =
        cube.position.x + (posTarget.x - cube.position.x) * falloff;
      cube.position.y =
        cube.position.y + (posTarget.y - cube.position.y) * falloff;

      cube.rotation.y = _t * 0.3;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  // resize the renderer to fit the window size
  function resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
}
