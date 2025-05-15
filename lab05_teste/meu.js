/**
 * Programa usando WegGL para demonstrar a animação 3D de um cubo
 * em perspectiva com rotação em cada eixo. O cubo é iluminação por
 * uma fonte de luz pontual segundo o modelo de Phong.
 *
 * Bibliotecas utilizadas
 * macWebglUtils.js
 * MVnew.js do livro -- Interactive Computer Graphics
 *
 */

"use strict";

// ==================================================================
// Os valores a seguir são usados apenas uma vez quando o programa
// é carregado. Modifique esses valores para ver seus efeitos.

// calcula a matriz de transformação da camera, apenas 1 vez
const eye = vec3(10, 10, 0);
const at = vec3(0, 0, 0);
const up = vec3(0, 1, 0);

// Propriedades da fonte de luz
const LUZ = {
    pos: vec4(0.0, 3.0, 0.0, 1.0), // posição
    amb: vec4(0.2, 0.2, 0.2, 1.0), // ambiente
    dif: vec4(1.0, 1.0, 1.0, 1.0), // difusão
    esp: vec4(1.0, 1.0, 1.0, 1.0), // especular
};

// Propriedades do material
const MAT = {
    amb: vec4(0.8, 0.8, 0.8, 1.0),
    dif: vec4(1.0, 0.0, 1.0, 1.0),
    alfa: 50.0,    // brilho ou shininess
};

// Camera
const FOVY = 60;
const ASPECT = 1;
const NEAR = 0.1;
const FAR = 50;

// ==================================================================
// constantes globais

const FUNDO = [0.0, 0.0, 0.0, 1.0];
const EIXO_X_IND = 0;
const EIXO_Y_IND = 1;
const EIXO_Z_IND = 2;
const EIXO_X = vec3(1, 0, 0);
const EIXO_Y = vec3(0, 1, 0);
const EIXO_Z = vec3(0, 0, 1);

// ==================================================================
// variáveis globais
// as strings com os código dos shaders também são globais, estão
// no final do arquivo.

var gl;        // webgl2
var gCanvas;   // canvas

// objeto a ser renderizado
var gCubo = new Cubo();

var gCamera = {
    eye: vec3(2.75, 2.75, 2.75),
    at: vec3(0, 0, 0),
    up: vec3(0, 1, 0),
    vang: 0,
    hang: 0,
}

// guarda coisas do shader
var gShader = {
    aTheta: null,
};

// guarda coisas da interface e contexto do programa
var gCtx = {
    view: mat4(),     // view matrix, inicialmente identidade
    perspective: mat4(), // projection matrix
};

// ==================================================================
// chama a main quando terminar de carregar a janela
window.onload = main;

/**
 * programa principal.
 */
function main() {
    // ambiente
    gCanvas = document.getElementById("glcanvas");
    gl = gCanvas.getContext('webgl2');
    if (!gl) alert("Vixe! Não achei WebGL 2.0 aqui :-(");

    console.log("Canvas: ", gCanvas.width, gCanvas.height);

    // interface
    crieInterface();

    // Inicializações feitas apenas 1 vez
    gl.viewport(0, 0, gCanvas.width, gCanvas.height);
    gl.clearColor(FUNDO[0], FUNDO[1], FUNDO[2], FUNDO[3]);
    gl.enable(gl.DEPTH_TEST);

    // shaders
    crieShaders();

    gCubo.init();

    // finalmente...
    render();
}

// ==================================================================
/**
 * Cria e configura os elementos da interface e funções de callback
 */
function crieInterface() {
    document.getElementById("xButton").onclick = function () {
        gCubo.axis = EIXO_X_IND;
    };
    document.getElementById("yButton").onclick = function () {
        gCubo.axis = EIXO_Y_IND;
    };
    document.getElementById("zButton").onclick = function () {
        gCubo.axis = EIXO_Z_IND;
    };
    document.getElementById("pButton").onclick = function () {
        gCubo.rodando = !gCubo.rodando;
    };
    document.getElementById("alfaSlider").onchange = function (e) {
        gCtx.alfaEspecular = e.target.value;
        console.log("Alfa = ", gCtx.alfaEspecular);
        gl.uniform1f(gShader.uAlfaEsp, gCtx.alfaEspecular);
    };
    window.onkeydown = moveCamera;
}

// ==================================================================





function moveCamera(e) {
    console.log(e.key);
    switch(e.key) {
        case "ArrowUp":
            gCamera.vang += 10;
            if (gCamera.vang > 90) gCamera.vang = 90
            break;
        case "ArrowDown":
            gCamera.vang -= 10;
            if (gCamera.vang < -90) gCamera.vang = -90
            break;
        case "ArrowLeft":
            gCamera.hang -= 10;
            if (gCamera.hang < -180) gCamera.hang = -180
            break;
        case "ArrowRight":
            gCamera.hang += 10;
            if (gCamera.hang > 180) gCamera.hang = 180
            break;
    }

    console.log(gCamera.vang + " " + gCamera.hang);

    const vangRad = gCamera.vang * Math.PI / 180;
    const hangRad = gCamera.hang * Math.PI / 180;

    const RADIUS = 5.0; // ou o valor que você estiver usando

    gCamera.eye = vec3(
        RADIUS * Math.cos(vangRad) * Math.sin(hangRad),
        RADIUS * Math.sin(vangRad),
        RADIUS * Math.cos(vangRad) * Math.cos(hangRad)
    );

    gCtx.view = lookAt(gCamera.eye, gCamera.at, gCamera.up);
}




/**
 * cria e configura os shaders
 */
function crieShaders() {
    //  cria o programa
    gShader.program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
    gl.useProgram(gShader.program);



    var aNormal = gl.getAttribLocation(gShader.program, "aNormal");
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);



    var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
    gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    // resolve os uniforms
    gShader.uModel = gl.getUniformLocation(gShader.program, "uModel");
    gShader.uView = gl.getUniformLocation(gShader.program, "uView");
    gShader.uPerspective = gl.getUniformLocation(gShader.program, "uPerspective");
    gShader.uInverseTranspose = gl.getUniformLocation(gShader.program, "uInverseTranspose");

    // calcula a matriz de transformação perpectiva (fovy, aspect, near, far)
    // que é feita apenas 1 vez
    gCtx.perspective = perspective(FOVY, ASPECT, NEAR, FAR);
    gl.uniformMatrix4fv(gShader.uPerspective, false, flatten(gCtx.perspective));

    gCtx.view = lookAt(eye, at, up);
    gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));

    // parametros para iluminação
    gShader.uLuzPos = gl.getUniformLocation(gShader.program, "uLuzPos");
    gl.uniform4fv(gShader.uLuzPos, LUZ.pos);

    // fragment shader
    gShader.uCorAmb = gl.getUniformLocation(gShader.program, "uCorAmbiente");
    gShader.uCorDif = gl.getUniformLocation(gShader.program, "uCorDifusao");
    gShader.uCorEsp = gl.getUniformLocation(gShader.program, "uCorEspecular");
    gShader.uAlfaEsp = gl.getUniformLocation(gShader.program, "uAlfaEsp");

    gl.uniform4fv(gShader.uCorAmb, mult(LUZ.amb, MAT.amb));
    gl.uniform4fv(gShader.uCorDif, mult(LUZ.dif, MAT.dif));
    gl.uniform4fv(gShader.uCorEsp, LUZ.esp);
    gl.uniform1f(gShader.uAlfaEsp, MAT.alfa);

};

// ==================================================================
/**
 * Usa o shader para desenhar.
 * Assume que os dados já foram carregados e são estáticos.
 */
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (gCubo.rodando) gCubo.theta[gCubo.axis] += 2.0;

    let model = mat4();
    model = mult(model, rotate(-gCubo.theta[EIXO_X_IND], EIXO_X));
    model = mult(model, rotate(-gCubo.theta[EIXO_Y_IND], EIXO_Y));
    model = mult(model, rotate(-gCubo.theta[EIXO_Z_IND], EIXO_Z));

    const modelView = mult(gCtx.view, model);
    const modelViewInvTrans = transpose(inverse(modelView));
    gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));
    gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
    gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

    // === Ativa VAO e desenha ===
    gl.bindVertexArray(gCubo.vao);
    gl.drawArrays(gl.TRIANGLES, 0, gCubo.np);
    gl.bindVertexArray(null);

    window.requestAnimationFrame(render);
}


// ========================================================
// Geração do modelo de um cubo de lado unitário
// ========================================================

const CUBO_CANTOS = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

/**  ................................................................
 * Objeto Cubo de lado 1 centrado na origem.
 *
 * usa função auxiliar quad(pos, nor, vert, a, b, c, d)
 */
function Cubo() {
    this.np = 36;
    this.pos = [];
    this.nor = [];
    this.vao = null;

    this.axis = EIXO_Z_IND;
    this.theta = vec3(0, 0, 0);
    this.rodando = true;

    this.init = function () {
        // Gera as posições e normais
        quad(this.pos, this.nor, CUBO_CANTOS, 1, 0, 3, 2);
        quad(this.pos, this.nor, CUBO_CANTOS, 2, 3, 7, 6);
        quad(this.pos, this.nor, CUBO_CANTOS, 3, 0, 4, 7);
        quad(this.pos, this.nor, CUBO_CANTOS, 6, 5, 1, 2);
        quad(this.pos, this.nor, CUBO_CANTOS, 4, 5, 6, 7);
        quad(this.pos, this.nor, CUBO_CANTOS, 5, 4, 0, 1);

        // === Criação do VAO ===
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Buffer de posições
        const bufVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pos), gl.STATIC_DRAW);
        var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        // Buffer de normais
        const bufNormais = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.nor), gl.STATIC_DRAW);
        const aNormal = gl.getAttribLocation(gShader.program, "aNormal");
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        // Desvincula o VAO
        gl.bindVertexArray(null);
    };
}

/**  ................................................................
 * cria triângulos de um quad e os carrega nos arrays
 * pos (posições) e nor (normais).
 * @param {*} pos : array de posições a ser carregado
 * @param {*} nor : array de normais a ser carregado
 * @param {*} vert : array com vértices do quad
 * @param {*} a : indices de vertices
 * @param {*} b : em ordem anti-horária
 * @param {*} c :
 * @param {*} d :
 */
function quad(pos, nor, vert, a, b, c, d) {
    var t1 = subtract(vert[b], vert[a]);
    var t2 = subtract(vert[c], vert[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);

    pos.push(vert[a]);
    nor.push(normal);
    pos.push(vert[b]);
    nor.push(normal);
    pos.push(vert[c]);
    nor.push(normal);
    pos.push(vert[a]);
    nor.push(normal);
    pos.push(vert[c]);
    nor.push(normal);
    pos.push(vert[d]);
    nor.push(normal);
};

// ========================================================
// Código fonte dos shaders em GLSL
// a primeira linha deve conter "#version 300 es"
// para WebGL 2.0

var gVertexShaderSrc = `#version 300 es

in  vec4 aPosition;
in  vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uPerspective;
uniform mat4 uInverseTranspose;

uniform vec4 uLuzPos;

out vec3 vNormal;
out vec3 vLight;
out vec3 vView;

void main() {
    mat4 modelView = uView * uModel;
    gl_Position = uPerspective * modelView * aPosition;

    // orienta as normais como vistas pela câmera
    vNormal = mat3(uInverseTranspose) * aNormal;
    vec4 pos = modelView * aPosition;

    vLight = (uView * uLuzPos - pos).xyz;
    vView = -(pos.xyz);
}
`;

var gFragmentShaderSrc = `#version 300 es

precision highp float;

in vec3 vNormal;
in vec3 vLight;
in vec3 vView;
out vec4 corSaida;

// cor = produto luz * material
uniform vec4 uCorAmbiente;
uniform vec4 uCorDifusao;
uniform vec4 uCorEspecular;
uniform float uAlfaEsp;

void main() {
    vec3 normalV = normalize(vNormal);
    vec3 lightV = normalize(vLight);
    vec3 viewV = normalize(vView);
    vec3 halfV = normalize(lightV + viewV);

    // difusao
    float kd = max(0.0, dot(normalV, lightV) );
    vec4 difusao = kd * uCorDifusao;

    // especular
    float ks = pow( max(0.0, dot(normalV, halfV)), uAlfaEsp);
    vec4 especular = vec4(0, 0, 0, 0); // parte não iluminada
    if (kd > 0.0) {  // parte iluminada
        especular = ks * uCorEspecular;
    }
    corSaida = difusao + especular + uCorAmbiente;
    corSaida.a = 1.0;
}
`;


