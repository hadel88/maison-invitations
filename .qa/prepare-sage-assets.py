from PIL import Image, ImageOps, ImageDraw
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
items=json.loads((root/'.qa/sage-assets.json').read_text())
sheet=Image.new('RGB',(1000,4*415),'#f4f0e7')
g=ImageDraw.Draw(sheet)
for i,item in enumerate(items):
    source=Image.open(item['path']).convert('RGB')
    source.save(root/'public'/('sage-original-'+item['key']+'.webp'),quality=88,method=6)
    tile=ImageOps.contain(source,(238,375))
    x=(i%4)*250+(250-tile.width)//2;y=(i//4)*415
    sheet.paste(tile,(x,y))
    g.text(((i%4)*250+10,y+382),item['key'],fill='#25372a')
sheet.save(root/'.qa/sage-original-contactsheet.jpg',quality=90)
print('Saved 16 original envelope textures and contact sheet')
