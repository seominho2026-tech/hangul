from pathlib import Path
p=Path('src/game/FestivalGame.ts');s=p.read_text(encoding='utf-8')
for a,b in {'한글날 SCHOOL FESTIVAL EDITION':'한글날 · 우리말 배움 잔치','PROLOGUE ·':'여는 이야기 ·','FINAL ·':'마지막 장 ·','BONUS CHALLENGE':'배움을 펼치는 추가 도전','>SCORE<':'>점수<','>TOTAL SCORE<':'>모은 점수<','>COMBO<':'>연속<','STAGE ${stage+1}':'제${stage+1}장','TOP ${config.rankingLimit}':'상위 ${config.rankingLimit}명','PNG 이미지 저장':'인증서 그림 저장','WASD 이동 · E 상호작용 · 모바일 터치 지원':'방향키로 이동 · 띄어쓰기 키로 발견 · 손가락 조작 지원','글자 가까이에서 E를 누르세요':'글자 가까이에서 띄어쓰기 키를 누르세요','<kbd>W A S D</kbd>':'<kbd>↑ ← ↓ →</kbd>','<kbd>E</kbd>':'<kbd>띄어쓰기</kbd>','WASD·방향키로 이동하고, 가까운 글자에서 E를 누르세요.':'방향키로 이동하고, 가까운 글자에서 띄어쓰기 키를 누르세요.','조선 궁궐 3D 탐험 공간':'조선 궁궐 입체 탐험 공간'}.items():s=s.replace(a,b)
s=s.replace("if(e.key.toLowerCase()==='e'&&!e.repeat)this.interact();", "if((e.key.toLowerCase()==='e'||(e.key===' '&&this.run.phase==='STAGE1'&&!(e.target as HTMLElement).closest('button,a,[role=button]')))&&!e.repeat)this.interact();")
p.write_text(s,encoding='utf-8')
p=Path('src/certificate/CertificateGenerator.ts');s=p.read_text(encoding='utf-8').replace('HANGEUL · SCHOOL FESTIVAL','한글날 · 우리말 배움 잔치').replace('CERTIFICATE OF ACHIEVEMENT','한글 배움의 결실');p.write_text(s,encoding='utf-8')
p=Path('src/world/PalaceWorld.ts');s=p.read_text(encoding='utf-8');old="const sign = this.textSprite('集賢殿', '#e9d5a2', '#253e38', 768, 240); sign.scale.set(4.2, 1.3, 1); sign.position.set(0, 5.2, -11.8); this.scene.add(sign);"
new="""const plaque = document.createElement('canvas'); plaque.width = 1024; plaque.height = 320;
    const pen = plaque.getContext('2d')!;
    const paintPlaque = () => {
      pen.fillStyle = '#20382e'; pen.fillRect(0, 0, 1024, 320);
      pen.strokeStyle = '#c9a461'; pen.lineWidth = 12; pen.strokeRect(18, 18, 988, 284);
      pen.lineWidth = 3; pen.strokeRect(35, 35, 954, 250);
      pen.fillStyle = '#f3dfad'; pen.textAlign = 'center'; pen.textBaseline = 'middle';
      pen.font = '700 202px "Noto Serif KR", "Malgun Gothic", serif';
      ['集','賢','殿'].forEach((letter,i)=>pen.fillText(letter, 272+i*240, 167));
    };
    paintPlaque();
    const plaqueTexture = new THREE.CanvasTexture(plaque); plaqueTexture.colorSpace = THREE.SRGBColorSpace;
    plaqueTexture.anisotropy = Math.min(4,this.renderer.capabilities.getMaxAnisotropy()); this.textures.push(plaqueTexture);
    const plaqueMaterial = new THREE.MeshBasicMaterial({map:plaqueTexture}); this.materials.push(plaqueMaterial);
    this.box(wood,0,5.02,-11.52,4.8,1.5,0.22);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.6,1.38),plaqueMaterial);
    sign.name = '집현전 현판'; sign.position.set(0,5.02,-11.395); this.scene.add(sign);
    void document.fonts.ready.then(()=>{paintPlaque();plaqueTexture.needsUpdate=true;});"""
s=s.replace(old,new)
a=s.index('    const foliage =');b=s.index('    const lantern =',a)
s=s[:a]+'''    const foliage = ['#b19239','#cbaa49','#7b8955','#b96c39'].map(color=>this.material(color));
    foliage.forEach(material=>{material.side=THREE.DoubleSide;});
    const branch = (a:THREE.Vector3,b:THREE.Vector3,r:number) => {
      const delta=b.clone().sub(a), center=a.clone().add(b).multiplyScalar(0.5);
      const geometry=new THREE.CylinderGeometry(r*0.48,r,delta.length(),6);
      geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));
      this.staticMesh(geometry,wood,center.x,center.y,center.z);
    };
    const leafShape=new THREE.Shape(); leafShape.moveTo(0,-0.25);
    leafShape.lineTo(-0.35,0.02);leafShape.lineTo(-0.29,0.25);leafShape.lineTo(-0.09,0.34);
    leafShape.lineTo(0,0.24);leafShape.lineTo(0.09,0.34);leafShape.lineTo(0.29,0.25);leafShape.lineTo(0.35,0.02);leafShape.closePath();
    const random=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
    let treeIndex=0;
    for (const [x,z,s,c] of [[-15,13,0.85,0],[15,14,0.95,1],[-19,-14,1.1,2],[18,-20,1.15,3],[-13,-6,0.7,1],[14,-6,0.8,0],[-28,10,1.2,3],[28,10,1.15,2]]) {
      const seed=++treeIndex*997;
      branch(new THREE.Vector3(x,0,z),new THREE.Vector3(x+0.25*s,5.8*s,z-0.15*s),0.3*s);
      for(let arm=0;arm<12;arm++){
        const angle=arm*2.399+treeIndex, height=(2.9+arm*0.22)*s, spread=(2.5-arm*0.1)*s;
        const start=new THREE.Vector3(x, height-0.8*s,z);
        const end=new THREE.Vector3(x+Math.cos(angle)*spread,height+0.65*s,z+Math.sin(angle)*spread);
        branch(start,end,0.105*s);
        for(let twig=0;twig<3;twig++){
          const n=seed+arm*100+twig*20;
          const tip=end.clone().add(new THREE.Vector3((random(n)-0.5)*1.4*s,0.35*s,(random(n+1)-0.5)*1.4*s));
          branch(end,tip,0.035*s);
          for(let leaf=0;leaf<26;leaf++){
            const k=n*37+leaf*7, az=random(k)*Math.PI*2, radius=Math.sqrt(random(k+1))*0.9*s;
            const geometry=new THREE.ShapeGeometry(leafShape);
            geometry.rotateX((random(k+2)-0.5)*2); geometry.rotateZ(random(k+3)*6.28);
            const size=(0.65+random(k+4)*0.65)*s;
            this.staticMesh(geometry,foliage[(c+(leaf%9===0?1:0))%4],tip.x+Math.cos(az)*radius,tip.y+(random(k+5)-0.5)*0.85*s,tip.z+Math.sin(az)*radius,size,size,size,az);
          }
        }
      }
    }
'''+s[b:];p.write_text(s,encoding='utf-8')
