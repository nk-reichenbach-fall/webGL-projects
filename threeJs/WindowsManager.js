let windows = [];

function createWindowObject() {
  window.addEventListener("beforeunload", () => {
    console.log("here", localStorage.getItem("count"));
  });
  windows = JSON.parse(localStorage.getItem("windows")) || [];
  let count = localStorage.getItem("count") || 0;

  const winShape = getShape();
  const winObj = { id: ++count, winShape };
  windows.push(winObj);

  localStorage.setItem("count", ++count);
  updateLocalStorage();
}

function getShape() {
  const shape = {
    x: window.screenLeft,
    y: window.screenTop,
    w: window.innerWidth,
    h: window.innerHeight,
  };

  return shape;
}

function getWindows() {
  return windows;
}

function updateLocalStorage() {
  localStorage.setItem("windows", JSON.stringify(windows));
}

export default {
  createWindowObject,
  getShape,
  getWindows,
};
