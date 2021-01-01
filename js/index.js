$(document).ready(function(){
  $('.carousel').carousel();
});

document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.sidenav');
  var instances = M.Sidenav.init(elems, {preventScrolling: true});
});

$('.sidenav > li > a').click(() => {
  console.log("click!");
  M.Sidenav.getInstance(document.getElementById('mobilenavbuttons')).close();
});

/* When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar */
var prevScrollpos = window.pageYOffset;
window.onscroll = function() {
  var currentScrollPos = window.pageYOffset;
  if (prevScrollpos > currentScrollPos) {
    $('nav').css({top: "0px"});
  } else {
    $('nav').css({top: "-10vh"});
  }
  prevScrollpos = currentScrollPos;
}

/* ---------------- Hypercube ------------- */

/* RENDERING */
const canvas = document.querySelector('.projects-bg')
const ctx = canvas.getContext('2d')
const start = Date.now()
const DURATION = 10000 //ms

function draw () {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const diff = Date.now() - start
  const i = diff / DURATION

    //ctx.globalCompositeOperation='screen'
  ctx.fillStyle = `hsla(${i*255},100%,5%,1)`
  ctx.strokeStyle =`hsla(${i*255 + 128},75%,50%,1)`
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.beginPath()
  
  hypercubeAnimationState(i)
    .vertex.forEach(line => {
      ctx.moveTo(...line[0])
      ctx.lineTo(...line[1])
      ctx.stroke()
    })
  
  ctx.moveTo(0, 350)
  ctx.lineTo(window.innerWidth, 350)
  ctx.stroke()
  
  window.requestAnimationFrame(draw)
}
window.requestAnimationFrame(draw)
/* /RENDERING */

/* ANIMATING */
const PERSP_Z = 1/2
const PERSP_O = 1/2

/* 1.animation */
function hypercubeAnimationState (i) {
  return Shape.hypercube()
  .map(pipe(
    matrixTransform(
      rotateXYMatrix4(1/23 * PI + i * 2*PI),
      rotateZMatrix4(PI/4),
      [
        [ 1, 0, 0, 0],
        [ 0, 1, 1, 0],
        [ 0, 0, 1, 0],
        [ 0, 0, 0, 1],
      ],
      rotateZMatrix4(-PI/2),
      rotateXYMatrix4(i * 2*PI),
    ),
    ([x, y, z, o]) => [x, y, z+1, o+1],
    (xs) => xs.map(x => x/2),
    ([x, y, z, o]) => {
      const coeff = (-PERSP_Z*z +1) * (-PERSP_O*o +1)
      return [x * coeff, y * coeff]
    },
    xs => xs.map(n => n * 300),
    xs => xs.map(n => n + 350),
  ))
}

/* 2.shape definition */
const Shape = ({joints = [], vertex = []}) => {
  return {
    joints,
    vertex,
    map: (fn) => Shape.of({
      joints: joints.map(fn),
      vertex: vertex.map(pts => pts.map(fn)),
    }),
    concat: (shape) => Shape.of({
      joints: joints.concat(shape.joints),
      vertex: vertex.concat(shape.vertex),
    }),
  }
}
Shape.of = Shape
Shape.empty = () => Shape.of({vertex: [], joints: []})
Shape.point = () => Shape.of({vertex: [], joints: [[]]})
Shape.primitive = (dimensions) => {
  // primitive(1) == a point
  // primitive(1) == a line
  // primitive(2) == a square
  // primitive(3) == a cube
  // primitive(4) == a hypercube
  if (dimensions == 0) {
    return Shape.point()
  } else {
    return extrude(Shape.primitive(dimensions - 1))
  }
}
Shape.hypercube = () => Shape.primitive(4)

const extrude = (shape) => {
  return concat(
    shape.map(pt => [...pt, -1]),
    shape.map(pt => [...pt, 1]),
    Shape.of({
      vertex: shape.joints.map(pt => [
        [...pt, -1], [...pt, 1],
      ])
    })
  )
}
/* /ANIMATING */

/* HELPERS */
/* 1.general helpers */
const concat = (first, ...concatables) => 
  concatables.reduce(
    (acc, x) => acc.concat(x), first
  )

const pipe = (fn, ...fns) => (...args) =>
  (fns.length == 0) ? fn(...args) : fns.reduce(
    (acc, x) => x(acc),
    fn(...args),
  )

/* 2.Math helpers */
const {cos, sin, PI} = Math

const matrixTransform = (...matrixs) => {
  var matrix = []
  if(matrixs.length == 1) {
    matrix = matrixs[0]
  } else {
    matrix = matrixs.reduceRight(matrixMultiplication)
  }
  
  return (point) => {
    if (matrix.length < point.length) throw `Error:
Matrix and point must have the same dimension: matrix has   ${matrix.length}, point has ${point.length}`
  
  
    return point.map((_, row) =>
      point.reduce((acc, n, column) =>
        acc + n * matrix[row][column]
      , 0)
      )
  }
}

const matrixMultiplication = (m1, m2) => {
  return m1.map((_, i) =>
    m2.map((_, j) =>
      m1.reduce((acc, _, k) =>
        acc + m1[i][k] * m2[k][j],
      0)
    )
  )
}

function rotateXYMatrix4(angle = 0) {
  const s = Math.sin(angle)
  const c = Math.cos(angle)
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, c,-s],
    [0, 0, s, c],
  ]
}

function rotateXMatrix4(angle = 0) {
  const s = Math.sin(angle)
  const c = Math.cos(angle)
  return [
    [1, 0, 0, 0],
    [0, c,-s, 0],
    [0, s, c, 0],
    [0, 0, 0, 1],
  ]
}
function rotateZMatrix4(angle = 0) {
  const s = Math.sin(angle)
  const c = Math.cos(angle)
  return [
    [c,-s, 0, 0],
    [s, c, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ]
}
function rotateYMatrix4(angle = 0) {
  const s = Math.sin(angle)
  const c = Math.cos(angle)
  return [
    [ c, 0, 0, s],
    [ 0, 1, 0, 0],
    [ 0, 0, 1, 0],
    [-s, 0, 0, c],
  ]
}

/* /HELPERS */