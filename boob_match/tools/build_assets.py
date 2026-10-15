"""Pack unchanged source pixels into a trimmed Phaser JSON atlas (requires Pillow)."""
import json
from pathlib import Path
from PIL import Image
import sys
root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
images = root / 'assets/img'
items = []
for index, name in enumerate(['ronda', 'nutella', 'madamx', 'asian', 'syren'], 1):
    source = Image.open(images / (name + '_spritesheet.png')).convert('RGBA')
    for frame in range(169):
        x, y = frame % 13 * 100, frame // 13 * 100
        tile = source.crop((x, y, x + 100, y + 100))
        box = tile.getchannel('A').getbbox() or (0, 0, 1, 1)
        items.append((f'block{index}_{frame}', tile.crop(box), box, 100, 100))
for name in ['cell', 'cloud']:
    source = Image.open(images / (name + '.png')).convert('RGBA')
    box = source.getchannel('A').getbbox() or (0, 0, 1, 1)
    items.append((name, source.crop(box), box, source.width, source.height))
items.sort(key=lambda item: item[1].height, reverse=True)
width = 2048
x = y = row_height = 0
placements = []
for item in items:
    tile = item[1]
    if x + tile.width + 4 > width:
        y += row_height
        x = row_height = 0
    placements.append((item, x + 2, y + 2))
    x += tile.width + 4
    row_height = max(row_height, tile.height + 4)
height = y + row_height
atlas = Image.new('RGBA', (width, height))
frames = {}
for (name, tile, box, sw, sh), x, y in placements:
    # Extrude border pixels to avoid texture bleeding under linear filtering.
    atlas.paste(tile, (x, y))
    for pad in (1, 2):
        atlas.paste(tile.crop((0, 0, tile.width, 1)), (x, y-pad))
        atlas.paste(tile.crop((0, tile.height-1, tile.width, tile.height)), (x, y+tile.height-1+pad))
        atlas.paste(tile.crop((0, 0, 1, tile.height)), (x-pad, y))
        atlas.paste(tile.crop((tile.width-1, 0, tile.width, tile.height)), (x+tile.width-1+pad, y))
    frames[name] = dict(frame=dict(x=x, y=y, w=tile.width, h=tile.height), rotated=False,
        trimmed=box != (0, 0, sw, sh), spriteSourceSize=dict(x=box[0], y=box[1], w=tile.width, h=tile.height), sourceSize=dict(w=sw, h=sh))
atlas.save(images / 'blocks-atlas.png', optimize=True)
(images / 'blocks-atlas.json').write_text(json.dumps(dict(frames=frames, meta=dict(image='blocks-atlas.png', size=dict(w=width, h=height))), separators=(',', ':')))
print(f'{len(frames)} frames, {width}x{height}, RGBA {width*height*4/1048576:.2f} MiB')
