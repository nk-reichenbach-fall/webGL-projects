import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

const DOT_SIZE = 0.09;
const DOT_COLOR = 0xffffff;
const WATER_COLOR = 0x416bdf;
const DOT_COLOR2 = 0xfff000;
const DOT_DENSITY = 1;

const SPHERE_RADIUS = 30;
const LATITUDE_COUNT = 80;

const MASK_IMAGE = "./assets/map.png";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  20,
  window.innerWidth / window.innerHeight,
  100,
  500
);
camera.position.set(0, 0, 320);

// Utility function to convert a dot on a sphere into a UV point on a
// rectangular texture or image.
const spherePointToUV = (dotCenter, sphereCenter) => {
  // Create a new vector and give it a direction from the center of the sphere
  // to the center of the dot.
  const newVector = new THREE.Vector3();
  newVector.subVectors(sphereCenter, dotCenter).normalize();

  // Calculate the  UV coordinates of the dot and return them as a vector.
  const uvX = 1 - (0.5 + Math.atan2(newVector.z, newVector.x) / (2 * Math.PI));
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

const imageLoader = new THREE.ImageLoader();
imageLoader.load(MASK_IMAGE, (image) => {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = image.width;
  tempCanvas.height = image.height;

  const ctx = tempCanvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const dotGeometries = [];
  const waterGeometries = [];
  const innerSphere = [];

  const vector = new THREE.Vector3();
  const innerVector = new THREE.Vector3();

  // Loop across the latitudes.
  for (let lat = 0; lat < LATITUDE_COUNT; lat += 1) {
    // Calculate the radius of the latitude line.
    const radius =
      Math.cos((-90 + (180 / LATITUDE_COUNT) * lat) * (Math.PI / 180)) *
      SPHERE_RADIUS;
    // Calculate the circumference of the latitude line.
    const latitudeCircumference = radius * Math.PI * 2 * 2;
    // Calculate the number of dots required for the latitude line.
    const latitudeDotCount = Math.ceil(latitudeCircumference * DOT_DENSITY);

    // Loop across the dot count for the latitude line.
    for (let dot = 0; dot < latitudeDotCount; dot += 1) {
      const dotGeometry = new THREE.CircleGeometry(DOT_SIZE, 5);
      const innerDotGeometry = new THREE.CircleGeometry(DOT_SIZE, 5);
      // Calculate the phi and theta angles for the dot.
      const phi = (Math.PI / LATITUDE_COUNT) * lat;
      const theta = ((2 * Math.PI) / latitudeDotCount) * dot;

      // Set the vector using the spherical coordinates generated from the sphere radius, phi and theta.
      vector.setFromSphericalCoords(SPHERE_RADIUS, phi, theta);
      innerVector.setFromSphericalCoords(SPHERE_RADIUS - 15, phi, theta);

      // Make sure the dot is facing in the right direction.
      dotGeometry.lookAt(vector);
      innerDotGeometry.lookAt(vector);

      // Move the dot geometry into position.
      dotGeometry.translate(vector.x, vector.y, vector.z);
      innerDotGeometry.translate(innerVector.x, innerVector.y, innerVector.z);

      dotGeometry.computeBoundingSphere();

      const uv = spherePointToUV(
        dotGeometry.boundingSphere.center,
        new THREE.Vector3()
      );

      const samplePixel = sampleImage(imageData, uv);

      // Push the positioned geometry into the array.
      if (samplePixel[3]) {
        dotGeometries.push(dotGeometry);
      } else {
        waterGeometries.push(dotGeometry);
      }
      innerSphere.push(innerDotGeometry);
    }
  }

  const mergedDotGeometrics =
    BufferGeometryUtils.mergeGeometries(dotGeometries);
  
  const mergedWaterGeometrics =
    BufferGeometryUtils.mergeGeometries(waterGeometries);
  
  const innerMergedDotGeometrics =
    BufferGeometryUtils.mergeGeometries(innerSphere);

  const dotMaterial = new THREE.MeshBasicMaterial({
    color: DOT_COLOR,
    side: THREE.DoubleSide,
  });
  const waterMaterial = new THREE.MeshBasicMaterial({
    color: WATER_COLOR,
    side: THREE.DoubleSide,
  });

  const dotMaterial2 = new THREE.MeshBasicMaterial({
    color: DOT_COLOR2,
    side: THREE.DoubleSide,
  });

  const dotMesh = new THREE.Mesh(mergedDotGeometrics, dotMaterial);
  const waterMesh = new THREE.Mesh(mergedWaterGeometrics, waterMaterial);
  const innerDotMesh = new THREE.Mesh(innerMergedDotGeometrics, dotMaterial2);

  scene.add(dotMesh);
  // scene.add(waterMesh);
  // scene.add(innerDotMesh);

  function animate(time) {
    requestAnimationFrame(animate);

    // Reduce the current timestamp to something manageable.
    time *= 0.001;

    // Update the dot mesh rotation.
    // dotMesh.rotation.order = ''
    dotMesh.rotation.y = time * 0.1;
    waterMesh.rotation.y = dotMesh.rotation.y;
    //   innerDotMesh.rotation.y = time * - 0.2;

    renderer.render(scene, camera);
  }

  animate();
});
