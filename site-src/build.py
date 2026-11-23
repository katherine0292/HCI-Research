# -*- coding: utf-8 -*-
"""Build ../portfolio/index.html from template.html + copy_data.py + base.css (the CircleU page style) + edit_block.html.
Usage: python3 build.py   (run inside src/)"""
import re, json, sys, os
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
from copy_data import C

edit_block = os.path.join(here, 'edit_block.html')
out = os.path.join(here, '..', 'index.html')
css = open(os.path.join(here, 'base.css'), encoding='utf-8').read()
css += "\n" + open(os.path.join(here, 'extra.css'), encoding='utf-8').read()

tpl = open(os.path.join(here, 'template.html'), encoding='utf-8').read()
js = open(os.path.join(here, 'main.js'), encoding='utf-8').read()

# every static data-k must exist; every key must be used (carousel keys sc<N>. are built in JS)
# keys used from JS
dyn = [f'iv.c{i:02d}' for i in range(1, 27)] + [f'pc.c{i:02d}' for i in range(1, 26)] + [f'pf.t{i}' for i in range(0, 6)] + [f'iv.t{i}' for i in range(1, 7)]
dyn += ['iv.ex.all', 'in.a1', 'in.b1', 'in.a2', 'in.b2', 'in.cue1', 'in.cue2', 'in.cue3', 'in.cue4', 'in.cue5', 'in.cue6', 'in.cap1', 'in.cap2', 'fp.hm.th', 'fp.s1s', 'fp.s2s', 'fp.s3s', 'fp.s4s']
for k in dyn:
    if k not in C: print('MISSING', k); sys.exit(1)
JSKEYS = set(dyn)
used = set(re.findall(r'data-k="([^"$]+)"', tpl))
missing = sorted(k for k in used if k not in C)
dyn = re.compile(r'^sc\d\.')
unused = sorted(k for k in C if k not in used and k not in JSKEYS and not k.startswith('nav.') and k not in ('ui.close', 'ft.copied'))
if missing: print('MISSING', missing); sys.exit(1)
if unused: print('UNUSED', unused)

data_js = 'const DATA=' + open(os.path.join(here, 'data.json'), encoding='utf-8').read().strip() + ';\n'
copy_js = data_js + 'const COPY=' + json.dumps({k: list(v) for k, v in C.items()}, ensure_ascii=False) + ';\n'
eb = open(edit_block, encoding='utf-8').read().replace("'cu-edits-local'", "'tlr-edits-local'")

head = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<link rel="icon" href="data:,"><style>:root{color-scheme:light}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n'
        '<title>Remembering in Motion</title>\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600&family=Noto+Sans+SC:wght@300;400;500;700&display=swap">\n'
        '<style>' + css + '</style>\n</head><body>\n')
html = head + tpl + '\n<script>\n' + copy_js + js + '</script>\n\n' + eb + '\n</body></html>\n'
open(out, 'w', encoding='utf-8').write(html)
print('ok', len(html), 'bytes;', len(C), 'keys')
