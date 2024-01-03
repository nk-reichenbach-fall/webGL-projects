main();

function main() {
  const canvas = document.querySelector("#glcanvas");
  const gl = canvas.getContext("webgl");

  if (gl === null) {
    alert("Browser does not support Web Gl");
    return;
  }

  function createSpherePointClouds(pointCloud) {
    const points = [];
    for (let i = 0; i < pointCloud; i++) {
      const r = () => Math.random() - 0.5;

      const inputPoints = [r(), r(), r()];

      const outputPoints = vec3.normalize(vec3.create(), inputPoints);

      points.push(...outputPoints);
    }

    return points;
  }

  const vertexData = createSpherePointClouds(1e6);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(
    vertexShader,
    `
    precision mediump float;

    attribute vec3 position;
    attribute vec3 color;
    varying vec3 vColor;

    uniform mat4 matrix;

    void main(){
        vColor = vec3(position.xy, 1);
        gl_Position = matrix * vec4(position, 1);
    }
    `
  );
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(
    fragmentShader,
    `
    precision mediump float;

    varying vec3 vColor;

    void main(){
        gl_FragColor = vec4(vColor, 1);
    }
    `
  );
  gl.compileShader(fragmentShader);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const positionLocation = gl.getAttribLocation(program, `position`);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

  const uniformLocations = {
    matrix: gl.getUniformLocation(program, `matrix`),
  };

  const modelMatrix = mat4.create();
  const viewMatrix = mat4.create();

  const projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    (75 * Math.PI) / 180, // Vertical field of view
    canvas.width / canvas.height, // aspect ratio
    1e-4, // near cull distance
    1e4 // far cull distance
  );

  mat4.translate(modelMatrix, modelMatrix, [0.2, 0.1, -2]);

  function animate() {
    requestAnimationFrame(animate);
    mat4.rotateY(modelMatrix, modelMatrix, 0.02);

    mat4.multiply(viewMatrix, projectionMatrix, modelMatrix);

    gl.uniformMatrix4fv(uniformLocations.matrix, false, viewMatrix);
    gl.drawArrays(gl.POINTS, 0, vertexData.length / 3);
  }

  animate();
}
