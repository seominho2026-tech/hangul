from pathlib import Path
p=Path('src/world/PalaceWorld.ts');s=p.read_text(encoding='utf-8');start=s.index('    for (let i = 0; i <= 36; i++) {',s.index('  private roof('));end=s.index('    for (const v of [-1, 1])',start);s=s[:start]+'''    // Tile seams are filtered in the roof shader instead of subpixel tube meshes.
'''+s[end:];needle="    // Subpixel decorative seams must not cast/receive unstable shadow-map stripes."
s=s.replace(needle,'''    // Screen-space filtering fades tile detail before it becomes smaller than a pixel.
    // Roofs still cast shadows, but do not receive self-shadow acne on shallow slopes.
    roof.userData.receiveShadow = false;
    roof.onBeforeCompile = shader => {
      shader.vertexShader = 'varying float vRoofX;\\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\\nvRoofX = (modelMatrix * vec4(position, 1.0)).x;');
      shader.fragmentShader = 'varying float vRoofX;\\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float tileCoord = vRoofX / 0.65;
        float pixelWidth = max(fwidth(tileCoord), 0.0001);
        float distanceToSeam = abs(fract(tileCoord + 0.5) - 0.5);
        float seam = 1.0 - smoothstep(0.045, 0.045 + pixelWidth, distanceToSeam);
        float visibility = 1.0 - smoothstep(0.18, 0.5, pixelWidth);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.3, seam * visibility);
      `);
    };
    roof.customProgramCacheKey = () => 'filtered-roof-tiles-v1';
'''+needle);p.write_text(s,encoding='utf-8')
