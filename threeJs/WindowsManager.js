let windows = [];
let winData = {};
let id;

function createWindowObject(reRender) {
  // Remove one element from windows, in the event of reload or close
  window.addEventListener("storage", () => {
    console.log("rerender");
    reRender();
  });

  window.addEventListener("beforeunload", () => {
    const existingWindows = getWindowsFromStorage();
    if (existingWindows.length) {
      existingWindows.pop();
      windows = existingWindows;
      updateLocalStorage();
    }
    reRender();
  });

  windows = JSON.parse(localStorage.getItem("windows")) || [];
  let count = localStorage.getItem("count") || 0;

  const winShape = getShape();
  const winObj = { id: ++count, winShape };
  id = winObj.id;
  winData = winObj;
  windows.push(winObj);

  localStorage.setItem("count", count);
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

function updateWindowChange(updateWindowShape) {
  const winShapes = getShape();

  if (
    winShapes.x !== winData.winShape.x ||
    winShapes.y !== winData.winShape.y ||
    winShapes.w !== winData.winShape.w ||
    winShapes.h !== winData.winShape.h
  ) {
    winData.winShape = winShapes;
    updateWindowShape();
    getWindowsById(id).winShape = winShapes;
    updateLocalStorage();
  }
}

function getWindows() {
  return JSON.parse(localStorage.getItem("windows")) || [];
}

function updateLocalStorage() {
  localStorage.setItem("windows", JSON.stringify(windows));
}

function getWindowsFromStorage() {
  return JSON.parse(localStorage.getItem("windows")) || [];
}

function getWindowsById(id) {
  return windows.find((win) => win.id === id);
}

export default {
  createWindowObject,
  updateWindowChange,
  getShape,
  getWindows,
};
