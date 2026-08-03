#!/usr/bin/env python3
"""Generate the standalone single-file build.

sim.js stays the one place the rules live: the browser app, the test suite and
the future submission server all load that same file. This script only inlines
it, so mousemaze.html is a build artifact and never edited by hand.
"""
import pathlib, re, sys

here = pathlib.Path(__file__).parent
html = (here / 'index.html').read_text()
sim = (here / 'sim.js').read_text()

tag = '<script src="sim.js"></script>'
if tag not in html:
    sys.exit('index.html no longer has the sim.js script tag')

out = html.replace(tag, '<script>\n/* inlined from sim.js by build.py */\n' + sim + '</script>', 1)
(here / 'mousemaze.html').write_text(out)
print('mousemaze.html written:', len(out), 'bytes')
