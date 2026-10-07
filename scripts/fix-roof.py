from pathlib import Path
p=Path('src/world/PalaceWorld.ts');s=p.read_text(encoding='utf-8');s=s.replace('mesh.castShadow = true; mesh.receiveShadow = true; this.scene.add(mesh);','mesh.castShadow = material.userData.castShadow !== false; mesh.receiveShadow = material.userData.receiveShadow !== false; this.scene.add(mesh);')
s=s.replace('const pts = Array.from({ length: 13 }, (_, k) => { const v = k / 12 * 2 - 1; return new THREE.Vector3(x + u * w / 2, shape(u, v) + 0.045, z + v * d / 2); });','// Keep raised tile seams clear of the tessellated roof, including the ridge.\n      const pts = Array.from({ length: 73 }, (_, k) => { const v = k / 72 * 2 - 1; return new THREE.Vector3(x + u * w / 2, shape(u, v) + 0.16, z + v * d / 2); });')
s=s.replace('new THREE.CatmullRomCurve3(pts), 16, 0.045, 4, false','new THREE.CatmullRomCurve3(pts), 72, 0.035, 4, false')
s=s.replace("const gold = this.material('#cbb477')", "// Subpixel decorative seams must not cast/receive unstable shadow-map stripes.\n    tile.userData.castShadow = false; tile.userData.receiveShadow = false;\n    const gold = this.material('#cbb477')")
p.write_text(s,encoding='utf-8')
