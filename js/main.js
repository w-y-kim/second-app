const socket = io();
let questionData = [];
let isPainter=false;

function gameStart(){
    socket.emit('game-start', {nickname: $("#nickname").val() });
    $("#start-screen").hide();
    $("#logout-screen").show();
}
$("#start-button").on('click', ()=>{
    const playerName = $("#nickname").val();
    if (playerName) {
        gameStart();
    }
});

function logOut(){
    // socket.emit('logout');
    mainOpen();
    $("#start-screen").show();
    $("#logout-screen").hide();
}
$("#logout-button").on('click', logOut);

function drawOpen(){
    $("#draw-screen").show();
    $("#main-screen").hide();
}
$("#draw-alone-button").on('click', ()=>{
  isPainter = true;
  $("#pallet").show();
  drawOpen();
});
$("#draw-relay-button").on('click', ()=>{
  isPainter = true;
  $("#pallet").show();
  drawOpen();
});
$("#draw-gether-button").on('click', ()=>{
  isPainter = true;
  $("#pallet").show();
  drawOpen();
});
$("#join-button").on('click', ()=>{
  $("#pallet").hide();
  readCanvas();
  drawOpen();
});

function mainOpen(){
    $("#draw-screen").hide();
    $("#main-screen").show();
}
$("#quit-button").on('click', ()=>{
  isPainter=false;
  mainOpen();
});

function readCanvas(){
  socket.emit('requestCurrentCanvas');
}

window.addEventListener('load', () => {
  const canvas = document.querySelector('#draw-area');
  const context = canvas.getContext('2d');
  const lastPosition = { x: null, y: null };
  let isDrag = false;

  function scrollX(){
        return document.documentElement.scrollLeft || document.body.scrollLeft;
  }
  function scrollY(){
        return document.documentElement.scrollTop || document.body.scrollTop;
  }
  function getPositionX (event) {
        const position = event.touches[0].clientX - $(canvas).position().left + scrollX() - parseInt($('#body').css('margin-left'), 10);
        return position;
  }
  function getPositionY (event) {
        const position = event.touches[0].clientY - $(canvas).position().top + scrollY();
        return position;
  }

  // 現在の線の色を保持する変数(デフォルトは黒(#000000)とする)
  let currentColor = '#000000';

  function sendDraw(x, y) {
    if(!isDrag) {
      return;
    }
    let lastPositionX = lastPosition.x;
    let lastPositionY = lastPosition.y;
    if (lastPosition.x === null || lastPosition.y === null) {
      lastPositionX = x;
      lastPositionY = y;
    }
    const drawData = {
        act: 'move',
        x: x,
        y: y,
        lastPositionX: lastPositionX,
        lastPositionY: lastPositionY,
        color: currentColor,
    };
    socket.emit('draw', drawData);
    lastPosition.x = x;
    lastPosition.y = y;
  }

  function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function dragStart(event) {
    isDrag = true;
  }

  function dragEnd(event) {
    isDrag = false;
    lastPosition.x = null;
    lastPosition.y = null;
  }

  function draw(data){
    switch (data.act) {
        case "move":
            context.beginPath();
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = 5;
            context.strokeStyle = data.color;
            context.moveTo(data.lastPositionX, data.lastPositionY);
            context.lineTo(data.x, data.y);
            context.stroke();
            context.closePath();
            break;
        case "clear":
            clear();
    }
  }

  function initEventHandler() {
    const clearButton = document.querySelector('#clear-button');
    clearButton.addEventListener('click', ()=>{
      const drawData = {
        act: 'clear',
      };
      socket.emit('draw', drawData);
    });

    const eraserButton = document.querySelector('#eraser-button');
    eraserButton.addEventListener('click', () => {
      currentColor = '#FFFFFF';
    });

    canvas.addEventListener('mousedown', dragStart);
    canvas.addEventListener('mouseup', dragEnd);
    canvas.addEventListener('mouseout', dragEnd);
    canvas.addEventListener('mousemove', (event) => {
      if (isPainter) {
        sendDraw(event.layerX, event.layerY);
      }
    });
    canvas.addEventListener('touchstart', dragStart);
    canvas.addEventListener('touchend', dragEnd);
    canvas.addEventListener('touchmove', (event) => {
      if (isPainter) {
        event.preventDefault();
        sendDraw(getPositionX(event), getPositionY(event));
      }
    });
  }

  socket.on('receiveCurrentCanvas', (drawData)=>{
    drawData.forEach((data)=>{
      draw(data);
    });
  });

  socket.on('receiveDrawData', function(data) {
    draw(data);
  });

  function initColorPalette() {
    const joe = colorjoe.rgb('color-palette', currentColor);
    joe.on('done', color => {
      currentColor = color.hex();
    });
  }

  initEventHandler();

  // カラーパレット情報を初期化する
  initColorPalette();
});
