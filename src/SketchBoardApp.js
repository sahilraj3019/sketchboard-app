import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const SketchBoardApp = () => {
  // State hooks for color, font size, etc.
  const [color, setColor] = useState('#000000');
  const [canvasBgColor, setCanvasBgColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const canvasRef = useRef(null); // Canvas reference for accessing the drawing context

  // Set canvas background color when the component mounts or when bg color changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [canvasBgColor]);

  // Handle color change for pen
  const handleColorChange = (event) => {
    setColor(event.target.value);
  };

  // Handle background color change for canvas
  const handleCanvasBgColorChange = (event) => {
    setCanvasBgColor(event.target.value);
  };

  // Handle font size change for line width (this acts as the stroke width)
  const handleFontSizeChange = (event) => {
    setFontSize(Number(event.target.value));
  };

  // Handle pointer down to start drawing
  const handlePointerDown = (event) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setLastPosition({ x, y });
    const context = canvas.getContext('2d');
    if (context) {
      setUndoStack([...undoStack, canvas.toDataURL()]);
    }
  };

  // Handle pointer move to draw on the canvas
  const handlePointerMove = (event) => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(lastPosition.x, lastPosition.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = fontSize;
      ctx.lineCap = 'round'; // Makes the lines smoother
      ctx.stroke();
      ctx.closePath();
      setLastPosition({ x, y });
    }
  };

  // Handle pointer up to stop drawing
  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  // Handle pointer cancel (when pointer leaves the canvas on mobile)
  const handlePointerCancel = () => {
    setIsDrawing(false);
  };

  // Clear the canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    ctx.fillStyle = canvasBgColor; // Set new background color
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Redraw the background

    // Save current canvas state for undo
    setUndoStack([...undoStack, { type: 'clear' }]);
  };

  // Save the canvas as an image
  const handleSave = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'my-canvas.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  // Undo the last action
  const undo = () => {
    if (undoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const lastAction = undoStack.pop();
    setRedoStack([...redoStack, lastAction]);

    // Redraw canvas based on current history (excluding the last undone action)
    context.clearRect(0, 0, canvas.width, canvas.height);
    undoStack.forEach((action) => {
      if (action.type === 'clear') {
        context.clearRect(0, 0, canvas.width, canvas.height);
      } else if (action.type === 'draw') {
        const img = new Image();
        img.src = action.data;
        img.onload = () => {
          context.drawImage(img, 0, 0);
        };
      } else if (action.type === 'rectangle') {
        context.fillStyle = action.color;
        context.fillRect(action.x, action.y, action.width, action.height);
      } else if (action.type === 'circle') {
        context.beginPath();
        context.arc(action.x, action.y, action.radius, 0, 2 * Math.PI);
        context.fillStyle = action.color;
        context.fill();
        context.closePath();
      }
    });
  };

  // Redo the last undone action
  const redo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const lastAction = redoStack.pop();
    setUndoStack([...undoStack, lastAction]);

    // Redraw canvas based on current history (including the redone action)
    context.clearRect(0, 0, canvas.width, canvas.height);
    [...undoStack, lastAction].forEach((action) => {
      if (action.type === 'clear') {
        context.clearRect(0, 0, canvas.width, canvas.height);
      } else if (action.type === 'draw') {
        const img = new Image();
        img.src = action.data;
        img.onload = () => {
          context.drawImage(img, 0, 0);
        };
      } else if (action.type === 'rectangle') {
        context.fillStyle = action.color;
        context.fillRect(action.x, action.y, action.width, action.height);
      } else if (action.type === 'circle') {
        context.beginPath();
        context.arc(action.x, action.y, action.radius, 0, 2 * Math.PI);
        context.fillStyle = action.color;
        context.fill();
        context.closePath();
      }
    });
  };

  // Get random position on the canvas for drawing shapes
  const getRandomPosition = () => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const maxWidth = rect.width - 200;
    const maxHeight = rect.height - 150;
    return {
      x: Math.random() * maxWidth,
      y: Math.random() * maxHeight
    };
  };

  // Draw a random rectangle
  const drawRectangle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const { x, y } = getRandomPosition();
    const width = 200;
    const height = 150;

    context.fillStyle = color;
    context.fillRect(x, y, width, height);

    // Save the rectangle action to undo stack
    setUndoStack([
      ...undoStack,
      { type: 'rectangle', x, y, width, height, color }
    ]);
  };

  // Draw a random circle
  const drawCircle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const { x, y } = getRandomPosition();
    const radius = 50;

    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
    context.closePath();

    // Save the circle action to undo stack
    setUndoStack([
      ...undoStack,
      { type: 'circle', x, y, radius, color }
    ]);
  };

  return (
    <div className="main">
      <h1>SketchBoard App</h1>
      <div className="top">
        <div className="block">
          <p>Text color picker</p>
          <input
            type="color"
            className="form-control"
            value={color}
            onChange={handleColorChange}
          />
        </div>
        <div className="block">
          <p>Background</p>
          <input
            type="color"
            className="form-control"
            value={canvasBgColor}
            onChange={handleCanvasBgColorChange}
          />
        </div>
        <div className="block">
          <p>Font size</p>
          <select
            className="custom-select"
            value={fontSize}
            onChange={handleFontSizeChange}
          >
            <option value="5">5px</option>
            <option value="10">10px</option>
            <option value="20">20px</option>
            <option value="30">30px</option>
            <option value="40">40px</option>
            <option value="50">50px</option>
          </select>
        </div>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="canvas"
          id="myCanvas"
          width="800"
          height="500"
          style={{ backgroundColor: canvasBgColor }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerCancel} // Handles touch or stylus interruptions
        ></canvas>
      </div>

      <div className="bottom">
        <button type="button" className="btn btn-danger" onClick={handleClear}>
          Clear
        </button>
        <button type="button" className="btn btn-success" onClick={handleSave}>
          Download
        </button>
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
        <button onClick={drawRectangle}>Draw Rectangle</button>
        <button onClick={drawCircle}>Draw Circle</button>
      </div>
    </div>
  );
};

export default SketchBoardApp;
