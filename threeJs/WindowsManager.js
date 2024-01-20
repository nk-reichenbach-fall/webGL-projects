let windows = [];
let winData = {};
let id;

function createWindowObject(reRender) {
  addEventListener("storage", (event) => {
    if (event.key === "windows") {
      let newWindows = JSON.parse(event.newValue);
      let winChange = didWindowsChange(windows, newWindows);

      windows = newWindows;

      if (winChange) {
        reRender();
      }
    }
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

function didWindowsChange(pWins, nWins) {
  if (pWins.length !== nWins.length) {
    return true;
  } else {
    let changed = false;

    for (let i = 0; i < pWins.length; i++) {
      if (pWins[i].id !== nWins[i].id) {
        changed = true;
      }
    }

    return changed;
  }
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
    getWindowsById(id).winShape = winShapes;
    updateWindowShape();
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
