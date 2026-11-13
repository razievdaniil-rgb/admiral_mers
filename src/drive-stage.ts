import * as T from "three";

export function createDriveStage(scene: T.Scene, car: T.Group) {
  const travel = { value: 0 },
    glow = { value: 0 };
  const roadMaterial = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTravel: travel, uGlow: glow },
    vertexShader:
      "varying vec3 vRoad;void main(){vec4 p=modelMatrix*vec4(position,1.);vRoad=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}",
    fragmentShader: `varying vec3 vRoad;uniform float uTravel;uniform float uGlow;
    void main(){vec2 cell=abs(fract(vec2(vRoad.x+uTravel,vRoad.z)*.5)-.5);vec2 aa=max(fwidth(cell),vec2(.002));vec2 grid=1.-smoothstep(aa*.35,aa*1.1,cell);float line=max(grid.x,grid.y);
    float fade=(1.-smoothstep(4.,14.,abs(vRoad.x)))*(1.-smoothstep(1.5,6.,abs(vRoad.z)));
    float lane=(1.-smoothstep(.015,.035,abs(abs(vRoad.z)-1.65)))*step(.4,fract((vRoad.x+uTravel)*.45));
    gl_FragColor=vec4(.35,.43,.53,fade*(line*.025+lane*(.12+uGlow*.12)));}`,
  });
  const road = new T.Mesh(new T.PlaneGeometry(60, 14), roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.y = -0.025;
  road.renderOrder = -2;
  scene.add(road);
  const shadowMaterial = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying vec2 vUv;void main(){float d=length((vUv-.5)*vec2(1.,1.8));gl_FragColor=vec4(0.,0.,0.,pow(1.-smoothstep(.05,.6,d),2.)*.6);}",
  });
  const shadow = new T.Mesh(new T.PlaneGeometry(6, 3.4), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.012;
  shadow.renderOrder = -1;
  car.add(shadow);
  const strength = { value: 0 };
  const scanMaterial = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: T.DoubleSide,
    uniforms: { uStrength: strength },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying vec2 vUv;uniform float uStrength;void main(){float beam=exp(-pow((vUv.x-.5)*45.,2.));float halo=exp(-pow((vUv.x-.5)*10.,2.));float ends=smoothstep(0.,.18,vUv.y)*(1.-smoothstep(.78,1.,vUv.y));gl_FragColor=vec4(.48,.78,.94,(beam*.46+halo*.09)*ends*uStrength);}",
  });
  scanMaterial.forceSinglePass = true;
  const scanner = new T.Mesh(new T.PlaneGeometry(3.1, 2.05), scanMaterial);
  scanner.rotation.y = 0;
  scanner.position.y = 0.96;
  scanner.renderOrder = 8;
  scanner.visible = false;
  car.add(scanner);
  return {
    update(x: number, s: number, distance: number, moving: boolean) {
      scanner.position.x = x;
      scanner.visible = s > 0.005;
      strength.value = s;
      travel.value = distance;
      glow.value = s + (moving ? 0.3 : 0);
    },
    dispose() {
      scene.remove(road);
      road.geometry.dispose();
      roadMaterial.dispose();
    },
  };
}
