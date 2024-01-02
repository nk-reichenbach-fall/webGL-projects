main();

function main() {
  const canvas = document.querySelector("#glcanvas");
  const gl = canvas.getContext("webgl");

  if (gl === null) {
    alert("Browser does not support Web Gl");
    return;
  }

  /*
     0,  1, 0, 
     1, -1, 0, 
    -1, -1, 0
  */
  const vertexData = [
    // Front
    0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5,
    0.5, -0.5, -0.5, 0.5,

    // Left
    -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5,
    -0.5, 0.5, -0.5, -0.5, -0.5,

    // Back
    -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5,
    -0.5, -0.5, 0.5, -0.5, -0.5,

    // Right
    0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
    0.5, 0.5, -0.5, -0.5,

    // Top
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5,
    -0.5, -0.5, 0.5, -0.5,

    // Bottom
    0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5,
    -0.5, -0.5, -0.5, -0.5, -0.5,
  ];

  /*
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  */
  function randomColor() {
    return [Math.random(), Math.random(), Math.random()];
  }

  const colorData = [];
  for (let face = 0; face < 6; face++) {
    const faceColor = randomColor();
    for (let vertex = 0; vertex < 6; vertex++) {
      colorData.push(...faceColor);
      // colorData.push(...randomColor());
    }
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW);

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
        vColor = color;
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

  const colorLocation = gl.getAttribLocation(program, `color`);
  gl.enableVertexAttribArray(colorLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

  const uniformLocations = {
    matrix: gl.getUniformLocation(program, `matrix`),
  };

  const matrix = mat4.create();
  mat4.translate(matrix, matrix, [0.2, 0.5, -2]);

  const projectionMatrix = mat4.create();
  const finalMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    (75 * Math.PI) / 180, // Vertical field of view
    canvas.width / canvas.height, // aspect ratio
    1e-4, // near cull distance
    1e4 // far cull distance
  );

  function animate() {
    requestAnimationFrame(animate);
    mat4.rotateZ(matrix, matrix, Math.PI / 2 / 100);
    mat4.rotateX(matrix, matrix, Math.PI / 2 / 100);

    mat4.multiply(finalMatrix, projectionMatrix, matrix);

    gl.uniformMatrix4fv(uniformLocations.matrix, false, finalMatrix);
    // gl.uniformMatrix4fv(uniformLocations.matrix, false, matrix);
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3);
  }

  animate();
}
