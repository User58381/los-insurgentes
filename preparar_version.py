#!/usr/bin/env python3
"""Genera version.json y sincroniza index.html, sin dependencias externas.
Ejecutar después de editar los archivos y antes de subir el paquete completo.
"""
from pathlib import Path
import hashlib
import json
import re

ROOT=Path(__file__).resolve().parent
index=ROOT/'index.html'
html=index.read_text(encoding='utf-8')
normalized=re.sub(r'data-version="[^"]+"','data-version="BUILD"',html)
normalized=re.sub(r'\?v=[A-Za-z0-9._-]+','?v=BUILD',normalized)
assets={}
for path in sorted(ROOT.rglob('*')):
    relative=path.relative_to(ROOT).as_posix()
    if not path.is_file() or relative.startswith(('.', 'tests/', 'tools/')):continue
    if relative in ('index.html','version.json','preparar_version.py'):continue
    if path.suffix.lower() not in ('.js','.css','.png','.jpg','.webp','.svg','.mp3','.ogg','.wav','.m4a','.html'):continue
    assets[relative]=hashlib.sha256(path.read_bytes()).hexdigest()[:20]
source=json.dumps(assets,sort_keys=True)+normalized
version='v10-'+hashlib.sha256(source.encode()).hexdigest()[:16]
html=re.sub(r'data-version="[^"]+"','data-version="'+version+'"',html)
html=re.sub(r'\?v=[A-Za-z0-9._-]+','?v='+version,html)
index.write_text(html,encoding='utf-8')
(ROOT/'version.json').write_text(json.dumps({'version':version,'assets':assets},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Versión preparada:',version,'·',len(assets),'recursos. No se modificaron guardados.')
