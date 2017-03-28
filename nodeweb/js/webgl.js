// korzystamy z literałów szablonów zamiast wczytywać shadery z pliku albo zapisywać jako tekst
var shader_fs =` 
    precision mediump float;
    varying vec4 vColor;
    varying vec3 vLightWeighting;
	varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    void main(void) {//
        //vec4 textureColor = vColor;
		vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        gl_FragColor = vec4(textureColor.rgb * vColor.rgb * vLightWeighting, textureColor.a);
		}
`;
var shader_vs =` 
    attribute vec3 aVertexPosition;
    attribute vec4 aVertexColor;
	attribute vec2 aTextureCoord;
	attribute vec3 aVertexNormal;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;
	uniform mat3 uNMatrix;

	uniform vec3 uAmbientColor;
    uniform vec3 uLightingDirection;
    uniform vec3 uDirectionalColor;

    varying vec4 vColor;
	varying vec2 vTextureCoord;
	varying vec3 vLightWeighting;

    void main(void) {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
        vColor = aVertexColor;
		vTextureCoord = aTextureCoord;
		vec3 transformedNormal = uNMatrix * aVertexNormal;
		float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);
		vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;
    }
`;
//-----------------------------------------------------------------------------------------------
$(function(){ webGLStart();})
var gl;
var kat1=0;
var kat2=0;
var kat3=0;
var kat4=0;
var kat5=0;

function initGL(canvas) {
	try {
	   // gl = setupWebGL(canvas) ;
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	} catch (e) {
	}
	if (!gl) {
		alert("Nie mogę zainicjować WebGL, przepraszam :-(");
	}
}

var shaderProgram;

function initShaders() {

	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, shader_vs);
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(vertexShader));
		return null;
	}
	
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, shader_fs);
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(fragmentShader));
		return null;
	}
	
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Nie mogę zainicjować shaderów");
	}

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	
	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
	shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
	shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
	shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
	//oświetlenie
	gl.uniform3f(	shaderProgram.ambientColorUniform,0.4,0.4,0.4	);
	var lightingDirection = [ 0.0,-4.0,-4.0];
	var adjustedLD = vec3.create();
	vec3.normalize(lightingDirection, adjustedLD);
	vec3.scale(adjustedLD, -1);
	gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);
	gl.uniform3f( shaderProgram.directionalColorUniform,2.0,2.0,2.0 );
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	var normalMatrix = mat3.create();
	mat4.toInverseMat3(mvMatrix, normalMatrix);
	mat3.transpose(normalMatrix);
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

var crateTexture;

/*function handleLoadedTexture(texture) {
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
}*/

function initTexture() {
	crateTexture = gl.createTexture();
	crateTexture.image = new Image();
	crateTexture.image.onload = function () {
	   // handleLoadedTexture(crateTexture)
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.bindTexture(gl.TEXTURE_2D, crateTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, crateTexture.image);
		//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255])); // 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	crateTexture.image.src = "img/crate.gif";//metal.jpg";
}

var cubeVertexPositionBuffer;
var cubeVertexColorBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;
var cubeVertexNormalBuffer;

function initBuffers() {
   	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	vertices = [
		//podstawa, srodek w srodku kwadrata
		// Front face
		-6.0, -1.1,  4.5,	 6.0, -1.1,  4.5,	 6.0,  1.1,  4.5,	-6.0,  1.1,  4.5,
		// Back face
		-6.0, -1.1, -4.5,	-6.0,  1.1, -4.5,	 6.0,  1.1, -4.5,	 6.0, -1.1, -4.5,
		// Top face
		-6.0,  1.1, -4.5,	-6.0,  1.1,  4.5,	 6.0,  1.1,  4.5,	 6.0,  1.1, -4.5,
		// Bottom face
		-6.0, -1.1, -4.5,	 6.0, -1.1, -4.5,	 6.0, -1.1,  4.5,	-6.0, -1.1,  4.5,
		// Right face
		 6.0, -1.1, -4.5,	 6.0,  1.1, -4.5,	 6.0,  1.1,  4.5,	 6.0, -1.1,  4.5,
		// Left face
		-6.0, -1.1, -4.5,	-6.0, -1.1,  4.5,	-6.0,  1.1,  4.5,	-6.0,  1.1, -4.5			
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = 24;

	cubeVertexPositionBuffer1 = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer1);
	vertices1 = [
		//poczatek w punkcie 0 , prostokat
		// Front face
		-0.9, -0.3,  0.0,	 0.9, -0.3,  0.0,	 0.9,  0.3,  0.0,	-0.9,  0.3,  0.0,
		// Back face
		-0.9, -0.3, -7.0,	-0.9,  0.3, -7.0,	 0.9,  0.3, -7.0,	 0.9, -0.3, -7.0,
		// Top face
		-0.9,  0.3, -7.0,	-0.9,  0.3,  0.0,	 0.9,  0.3,  0.0,	 0.9,  0.3, -7.0,
		// Bottom face
		-0.9, -0.3, -7.0,	 0.9, -0.3, -7.0,	 0.9, -0.3,  0.0,	-0.9, -0.3,  0.0,
		// Right face
		 0.9, -0.3, -7.0,	 0.9,  0.3, -7.0,	 0.9,  0.3,  0.0,	 0.9, -0.3,  0.0,
		// Left face
		-0.9, -0.3, -7.0,	-0.9, -0.3,  0.0,	-0.9,  0.3,  0.0,	-0.9,  0.3, -7.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices1), gl.STATIC_DRAW);
	cubeVertexPositionBuffer1.itemSize = 3;
	cubeVertexPositionBuffer1.numItems = 24;
	
	cubeVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
	var vertexNormals = [
		// Front face
		 0.0,  0.0,  1.0,	 0.0,  0.0,  1.0,	 0.0,  0.0,  1.0,	 0.0,  0.0,  1.0,
		// Back face
		 0.0,  0.0, -1.0,	 0.0,  0.0, -1.0,	 0.0,  0.0, -1.0,	 0.0,  0.0, -1.0,
		// Top face
		 0.0,  1.0,  0.0,	 0.0,  1.0,  0.0,	 0.0,  1.0,  0.0,	 0.0,  1.0,  0.0,
		// Bottom face
		 0.0, -1.0,  0.0,	 0.0, -1.0,  0.0,	 0.0, -1.0,  0.0,	 0.0, -1.0,  0.0,
		// Right face
		 1.0,  0.0,  0.0,	 1.0,  0.0,  0.0,	 1.0,  0.0,  0.0,	 1.0,  0.0,  0.0,
		// Left face
		-1.0,  0.0,  0.0,	-1.0,  0.0,  0.0,	-1.0,  0.0,  0.0,	-1.0,  0.0,  0.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
	cubeVertexNormalBuffer.itemSize = 3;
	cubeVertexNormalBuffer.numItems = 24;
	
	cubeVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
	var textureCoords = [
		// Front face
		0.0, 0.0,	1.0, 0.0,	1.0, 1.0,	0.0, 1.0,
		// Back face
		1.0, 0.0,	1.0, 1.0,	0.0, 1.0,	0.0, 0.0,
		// Top face
		0.0, 1.0,	0.0, 0.0,	1.0, 0.0,	1.0, 1.0,
		// Bottom face
		1.0, 1.0,	0.0, 1.0,	0.0, 0.0,	1.0, 0.0,
		// Right face
		1.0, 0.0,	1.0, 1.0,	0.0, 1.0,	0.0, 0.0,
		// Left face
		0.0, 0.0,	1.0, 0.0,	1.0, 1.0,	0.0, 1.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
	cubeVertexTextureCoordBuffer.itemSize = 2;
	cubeVertexTextureCoordBuffer.numItems = 24;
	
	cubeVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
	colors = [
		[1.0, 0.4, 0.4, 0.9], // Front face
		[0.4, 0.4, 1.0, 0.9], // Back face
		[0.9, 0.9, 0.9, 0.9], // Top face
		[0.9, 0.9, 1.0, 0.9], // Bottom face
		[0.9, 1.0, 0.9, 0.9], // Right face
		[0.9, 0.9, 0.9, 0.9]  // Left face
	];
	var unpackedColors = [];
	for (var i in colors) {
		var color = colors[i];
		for (var j=0; j < 4; j++) {
			unpackedColors = unpackedColors.concat(color);
		}
	}
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
	cubeVertexColorBuffer.itemSize = 4;
	cubeVertexColorBuffer.numItems = 24;

	cubeVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	var cubeVertexIndices = [
		0, 1, 2,      0, 2, 3,    // Front face
		4, 5, 6,      4, 6, 7,    // Back face
		8, 9, 10,     8, 10, 11,  // Top face
		12, 13, 14,   12, 14, 15, // Bottom face
		16, 17, 18,   16, 18, 19, // Right face
		20, 21, 22,   20, 22, 23  // Left face
	];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
	cubeVertexIndexBuffer.itemSize = 1;
	cubeVertexIndexBuffer.numItems = 36;
}

function drawScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

	mat4.identity(mvMatrix);

	mat4.translate(mvMatrix, [10.2, -9.0, -30.2]);
	//mat4.scale(mvMatrix, [0.2,0.2, 0.2]);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, crateTexture);
	gl.uniform1i(shaderProgram.samplerUniform, 0);
	
	mvPushMatrix();

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
		   
   
	//mat4.scale(mvMatrix, [1,0.1, 1]);
	setMatrixUniforms();
	//barkLP - pierwszy stopien swobody
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	//--------------------------------------------------------------------------------
	mat4.translate(mvMatrix, [-4.0, 1.0, 3.4]);
	mat4.rotate(mvMatrix, degToRad(kat1), [0, -1.0, 0.0]);
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer1);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer1.itemSize, gl.FLOAT, false, 0, 0);
	
	//barkGD - drugi stopien swobody
	mat4.rotate(mvMatrix, degToRad(kat2), [-1, 0, 0]);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	//---------------------------------------------------------------------
	//lokiec - trzeci stopien swobody
	mat4.translate(mvMatrix, [0.0, 0.0, -7.0]);
	mat4.rotate(mvMatrix, degToRad(kat3), [1, 0, 0]);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	//---------------------------------------------------------------------------
	//nadgarstek - czwarty stopien swobody
	mat4.translate(mvMatrix, [0.0, 0.0, -7.0])
	mat4.rotate(mvMatrix, degToRad(kat4), [-1, 0, 0]);
	mat4.scale(mvMatrix, [1,1,0.4]);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	//-----------------------------------------------------------------------------------
	//szczeki - piaty stopien swobody
	mat4.translate(mvMatrix, [0, 0.0, -7.0]);
	mat4.scale(mvMatrix, [0.3,1,0.8]);
	mvPushMatrix();
	mat4.translate(mvMatrix, [1.0, 0.0, 0.0]);
	mat4.rotate(mvMatrix, degToRad(kat5), [0, -1, 0]);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	mvPopMatrix();
	mat4.translate(mvMatrix, [-1.0, 0.0, 0.0]);
	mat4.rotate(mvMatrix, degToRad(kat5), [0, 1, 0]);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	
	mvPopMatrix();

}

function animate() {
	//z poprawkami do kalibracji z rzeczywistym ramieniem
	kat1=(($('#barkLP').val()/4)/1.9)+40;
	kat2=(($('#barkGD').val()/4)/1.6)+70;   
	kat3=(($('#lokiec').val()/4)/2.0)+90; 
	kat4=(($('#nadgarstek').val()/4)/2.6)-120; 
	kat5=(($('#szczeki').val()/4)/2.7)-75; 
}

function tick() {
	requestAnimFrame(tick);
	drawScene();
	animate();
}

function webGLStart() {
	var canvas = document.getElementById("canvas");
	initGL(canvas);
	initShaders()
	initBuffers();
	initTexture();

	gl.clearColor(0.52, 0.72, 0.003, 1.0);//85 B8 18
	//gl.clearColor(0.32, 0.42, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	tick();
}